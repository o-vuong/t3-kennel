import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { db } from "~/server/db";

const unsubscribeSchema = z.object({
	endpoint: z.string().url(),
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
		const { endpoint } = unsubscribeSchema.parse(body);

		// Remove subscription
		await db.pushSubscription.deleteMany({
			where: {
				endpoint,
				userId: session.user.id,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Push unsubscribe error:", error);
		return NextResponse.json(
			{ error: "Failed to unsubscribe from push notifications" },
			{ status: 500 },
		);
	}
}
