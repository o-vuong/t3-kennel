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
		const { endpoint, keys, userAgent } = body;

		if (!endpoint || !keys?.p256dh || !keys?.auth) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Store or update the push subscription
		await db.pushSubscription.upsert({
			where: { endpoint },
			update: {
				p256dh: keys.p256dh,
				auth: keys.auth,
				userAgent: userAgent || null,
				updatedAt: new Date(),
			},
			create: {
				userId: session.user.id,
				endpoint,
				p256dh: keys.p256dh,
				auth: keys.auth,
				userAgent: userAgent || null,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Push subscription error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
