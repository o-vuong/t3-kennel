import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { endpoint } = body;

		if (!endpoint) {
			return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
		}

		// Remove the push subscription
		await db.pushSubscription.deleteMany({
			where: {
				endpoint,
				userId: session.user.id,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Push unsubscription error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
