import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { generateWebAuthnRegistrationOptions } from "~/lib/auth/mfa";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const options = await generateWebAuthnRegistrationOptions(session.user.id);

		return NextResponse.json(options);
	} catch (error) {
		console.error("WebAuthn registration options error:", error);
		return NextResponse.json(
			{ error: "Failed to generate registration options" },
			{ status: 500 }
		);
	}
}
