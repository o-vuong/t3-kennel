import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { db } from "~/server/db";

const subscriptionSchema = z.object({
	endpoint: z.string().url(),
	keys: z.object({
		p256dh: z.string(),
		auth: z.string(),
	}),
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
		const subscription = subscriptionSchema.parse(body);
		const userAgent = request.headers.get("user-agent") ?? undefined;

		// Store or update subscription
		await db.pushSubscription.upsert({
			where: { endpoint: subscription.endpoint },
			update: {
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				userAgent,
				updatedAt: new Date(),
			},
			create: {
				userId: session.user.id,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				userAgent,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Push subscription error:", error);
		return NextResponse.json(
			{ error: "Failed to subscribe to push notifications" },
			{ status: 500 },
		);
	}
}
