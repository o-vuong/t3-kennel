import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { verifyRecoveryCode } from "~/lib/auth/mfa";

const recoverySchema = z.object({
	code: z.string().length(6),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { code } = recoverySchema.parse(body);

		const verified = await verifyRecoveryCode(session.user.id, code);

		if (!verified) {
			return NextResponse.json(
				{ error: "Invalid recovery code" },
				{ status: 400 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Recovery code verification error:", error);
		return NextResponse.json(
			{ error: "Failed to verify recovery code" },
			{ status: 500 }
		);
	}
}
