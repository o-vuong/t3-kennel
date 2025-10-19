import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { verifyTOTP } from "~/lib/auth/mfa";
import { db } from "~/server/db";

const verifySchema = z.object({
	token: z.string().length(6),
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
		const { token } = verifySchema.parse(body);

		const verified = await verifyTOTP(session.user.id, token);

		if (!verified) {
			return NextResponse.json(
				{ error: "Invalid TOTP token" },
				{ status: 400 },
			);
		}

		// Update user to enable TOTP
		await db.user.update({
			where: { id: session.user.id },
			data: { totpEnabled: true },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("TOTP verification error:", error);
		return NextResponse.json(
			{ error: "Failed to verify TOTP" },
			{ status: 500 },
		);
	}
}