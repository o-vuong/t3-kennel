import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { verifyOverrideToken } from "~/lib/auth/override-tokens";
import { withRls } from "~/server/db-rls";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { token } = body;

		if (!token) {
			return NextResponse.json(
				{ error: "Missing override token" },
				{ status: 400 }
			);
		}

		// Verify the override token
		const verification = verifyOverrideToken(token);
		if (!verification.valid || !verification.payload) {
			return NextResponse.json(
				{ error: "Invalid or expired override token" },
				{ status: 400 }
			);
		}

		const { payload } = verification;

		// Check if token is issued to this user
		if (payload.issuedTo !== session.user.id) {
			return NextResponse.json(
				{ error: "Token not issued to current user" },
				{ status: 403 }
			);
		}

		// Check if token is already used
		const approvalToken = await withRls(
			session.user.id,
			session.user.role,
			async (tx) => {
				return tx.approvalToken.findFirst({
					where: {
						nonce: payload.nonce,
						usedAt: null,
					},
				});
			}
		);

		if (!approvalToken) {
			return NextResponse.json(
				{ error: "Token already used or not found" },
				{ status: 400 }
			);
		}

		// Mark token as used
		await withRls(session.user.id, session.user.role, async (tx) => {
			await tx.approvalToken.update({
				where: { id: approvalToken.id },
				data: { usedAt: new Date() },
			});
		});

		// Create override event
		const overrideEvent = await withRls(
			session.user.id,
			session.user.role,
			async (tx) => {
				return tx.overrideEvent.create({
					data: {
						actorId: session.user.id,
						action: "CONSUME_TOKEN",
						entityType: payload.entityType,
						entityId: payload.entityId,
						scope: payload.scope,
						reason: `Override token consumed for ${payload.scope} access`,
						metadata: {
							tokenNonce: payload.nonce,
							issuedBy: payload.issuedBy,
							issuedAt: new Date(payload.expiresAt).toISOString(),
						},
					},
				});
			}
		);

		// Create audit log entry
		await withRls(session.user.id, session.user.role, async (tx) => {
			await tx.auditLog.create({
				data: {
					actorId: session.user.id,
					action: "OVERRIDE_TOKEN_CONSUMED",
					entityType: payload.entityType,
					entityId: payload.entityId,
					details: {
						scope: payload.scope,
						overrideEventId: overrideEvent.id,
						tokenNonce: payload.nonce,
					},
				},
			});
		});

		// Generate a short-lived override session ID
		const overrideSessionId = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		return NextResponse.json({
			success: true,
			overrideSessionId,
			expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
			scope: payload.scope,
			entityType: payload.entityType,
			entityId: payload.entityId,
		});
	} catch (error) {
		console.error("Override token consumption error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
