import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { generateTOTPSecret } from "~/lib/auth/mfa";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { secret, qrCode, recoveryCodes } = await generateTOTPSecret(
			session.user.id
		);

		return NextResponse.json({
			secret,
			qrCode,
			recoveryCodes,
		});
	} catch (error) {
		console.error("TOTP setup error:", error);
		return NextResponse.json(
			{ error: "Failed to setup TOTP" },
			{ status: 500 }
		);
	}
}
