import webpush from "web-push";
import { env } from "~/env";

// Only set VAPID details if keys are available
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
	webpush.setVapidDetails(
		env.VAPID_SUBJECT ?? "mailto:admin@localhost",
		env.VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY,
	);
}

export async function sendPush(
	subscription: webpush.PushSubscription,
	payload: unknown,
) {
	// Check if VAPID keys are configured
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
		throw new Error("VAPID keys not configured. Push notifications are disabled.");
	}

	return webpush.sendNotification(
		subscription,
		JSON.stringify(payload),
		{ TTL: 60 },
	);
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	url?: string;
	tag?: string;
	data?: Record<string, unknown>;
	actions?: Array<{
		action: string;
		title: string;
		icon?: string;
	}>;
}

export function createNotificationPayload(
	title: string,
	body: string,
	options?: Partial<PushNotificationPayload>,
): PushNotificationPayload {
	return {
		title,
		body,
		icon: "/icons/icon-192x192.png",
		badge: "/icons/badge-72x72.png",
		...options,
	};
}