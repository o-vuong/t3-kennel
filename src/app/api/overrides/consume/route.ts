import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { verifyOverrideToken, hashToken } from "~/lib/auth/override-tokens";
import { db } from "~/server/db";

const consumeSchema = z.object({
	token: z.string(),
	reason: z.string().min(1),
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

		const body = await request.json();
		const { token, reason } = consumeSchema.parse(body);

		// Verify token
		const verification = verifyOverrideToken(token);
		if (!verification.valid || !verification.payload) {
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 400 },
			);
		}

		const { payload } = verification;

		// Check if token was issued to this user
		if (payload.issuedTo !== session.user.id) {
			return NextResponse.json(
				{ error: "Token not issued to this user" },
				{ status: 403 },
			);
		}

		// Find and validate token in database
		const approvalToken = await db.approvalToken.findFirst({
			where: {
				token: hashToken(token),
				issuedToUserId: session.user.id,
				expiresAt: { gt: new Date() },
				usedAt: null,
				revokedAt: null,
			},
		});

		if (!approvalToken) {
			return NextResponse.json(
				{ error: "Token not found or already used" },
				{ status: 400 },
			);
		}

		// Mark token as used
		await db.approvalToken.update({
			where: { id: approvalToken.id },
			data: { usedAt: new Date() },
		});

		// Create override event
		const overrideEvent = await db.overrideEvent.create({
			data: {
				actorId: session.user.id,
				scope: payload.scope as any,
				reason,
				entityType: payload.entityType,
				entityId: payload.entityId,
				approvedByAdminId: payload.issuedBy,
				metadata: {
					tokenId: approvalToken.id,
					originalReason: approvalToken.metadata,
				},
			},
		});

		// Create audit log
		await db.auditLog.create({
			data: {
				actorId: session.user.id,
				action: "OVERRIDE",
				target: `${payload.entityType}:${payload.entityId}`,
				meta: {
					action: "consume_override_token",
					scope: payload.scope,
					entityType: payload.entityType,
					entityId: payload.entityId,
					reason,
					overrideEventId: overrideEvent.id,
				},
			},
		});

		// Generate short-lived override session ID
		const overrideSessionId = `override_${overrideEvent.id}_${Date.now()}`;

		return NextResponse.json({
			overrideSessionId,
			scope: payload.scope,
			entityType: payload.entityType,
			entityId: payload.entityId,
			expiresAt: payload.expiresAt,
		});
	} catch (error) {
		console.error("Override token consume error:", error);
		return NextResponse.json(
			{ error: "Failed to consume override token" },
			{ status: 500 },
		);
	}
}
