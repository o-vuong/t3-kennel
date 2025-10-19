import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { generateOverrideToken, hashToken } from "~/lib/auth/override-tokens";
import { db } from "~/server/db";
import { isMFAVerifiedRecently } from "~/lib/auth/mfa";

const issueSchema = z.object({
	issuedToUserId: z.string().cuid(),
	scope: z.enum([
		"BOOKING_CAPACITY",
		"PRICING",
		"POLICY_BYPASS",
		"REFUND",
		"DEPOSIT_WAIVER",
		"ADMIN_ACTION",
	]),
	entityType: z.string(),
	entityId: z.string(),
	reason: z.string().min(1),
	expiresInMinutes: z.number().min(1).max(15).default(15),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Check if user is admin or owner
		if (!["OWNER", "ADMIN"].includes(session.user.role)) {
			return NextResponse.json(
				{ error: "Insufficient permissions" },
				{ status: 403 },
			);
		}

		// Check if MFA was verified recently (within 5 minutes for override issuance)
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { mfaVerifiedAt: true },
		});

		if (!isMFAVerifiedRecently(user?.mfaVerifiedAt ?? null, 5)) {
			return NextResponse.json(
				{ error: "Recent MFA verification required" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const {
			issuedToUserId,
			scope,
			entityType,
			entityId,
			reason,
			expiresInMinutes,
		} = issueSchema.parse(body);

		// Verify target user exists
		const targetUser = await db.user.findUnique({
			where: { id: issuedToUserId },
			select: { id: true, role: true },
		});

		if (!targetUser) {
			return NextResponse.json(
				{ error: "Target user not found" },
				{ status: 404 },
			);
		}

		// Generate token
		const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
		const { token, nonce } = generateOverrideToken(
			session.user.id,
			issuedToUserId,
			scope,
			entityType,
			entityId,
			expiresAt,
		);

		// Store token hash in database
		await db.approvalToken.create({
			data: {
				token: hashToken(token),
				scope: scope as any,
				expiresAt,
				issuedByAdminId: session.user.id,
				issuedToUserId,
				metadata: {
					entityType,
					entityId,
					reason,
					nonce,
				},
			},
		});

		// Create audit log
		await db.auditLog.create({
			data: {
				actorId: session.user.id,
				action: "APPROVAL",
				target: `override_token:${scope}:${entityType}:${entityId}`,
				meta: {
					action: "issue_override_token",
					issuedTo: issuedToUserId,
					scope,
					entityType,
					entityId,
					reason,
					expiresAt: expiresAt.toISOString(),
				},
			},
		});

		return NextResponse.json({
			token,
			expiresAt: expiresAt.toISOString(),
			scope,
			entityType,
			entityId,
		});
	} catch (error) {
		console.error("Override token issue error:", error);
		return NextResponse.json(
			{ error: "Failed to issue override token" },
			{ status: 500 },
		);
	}
}
