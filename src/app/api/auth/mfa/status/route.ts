import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { getMFAStatus } from "~/lib/auth/mfa";

export async function GET(request: NextRequest) {
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

		const status = await getMFAStatus(session.user.id);

		if (!status) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(status);
	} catch (error) {
		console.error("MFA status error:", error);
		return NextResponse.json(
			{ error: "Failed to get MFA status" },
			{ status: 500 },
		);
	}
}