import { db } from "~/server/db";
import { sendEmail } from "./email";
import { createNotificationPayload, sendPush } from "./push";

export async function dispatchNotification(
	userId: string,
	type: string,
	payload: Record<string, unknown>
) {
	// Try push first
	const subscriptions = await db.pushSubscription.findMany({
		where: { userId },
	});

	let pushSuccess = false;
	for (const sub of subscriptions) {
		try {
			const notificationPayload = createNotificationPayload(
				payload.title as string,
				payload.message as string,
				{
					url: payload.url as string,
					tag: payload.tag as string,
					data: payload.data as Record<string, unknown>,
				}
			);

			await sendPush(
				{
					endpoint: sub.endpoint,
					keys: { p256dh: sub.p256dh, auth: sub.auth },
				},
				notificationPayload
			);
			pushSuccess = true;
		} catch (error) {
			console.error("Push notification failed:", error);
			// Remove invalid subscription
			await db.pushSubscription.delete({ where: { id: sub.id } });
		}
	}

	// Fallback to email if no push delivered
	if (!pushSuccess) {
		try {
			await sendEmail(userId, type, payload);
		} catch (error) {
			console.error("Email notification failed:", error);
		}
	}

	// Record notification in database
	await db.notification.create({
		data: {
			userId,
			type,
			title: payload.title as string,
			message: payload.message as string,
			payload: payload as any, // Cast to satisfy Prisma's Json type
			status: pushSuccess ? "delivered" : "sent_email",
		},
	});

	return { pushSuccess, emailSent: !pushSuccess };
}

// Convenience functions for common notification types
export async function notifyBookingConfirmed(
	userId: string,
	bookingId: string,
	startDate: string,
	endDate: string
) {
	return dispatchNotification(userId, "booking-confirmed", {
		title: "Booking Confirmed",
		message: "Your pet's booking has been confirmed",
		bookingId,
		startDate,
		endDate,
		tag: `booking-${bookingId}`,
		url: `/customer/bookings/${bookingId}`,
	});
}

export async function notifyBookingReminder(
	userId: string,
	bookingId: string,
	startDate: string
) {
	return dispatchNotification(userId, "booking-reminder", {
		title: "Booking Reminder",
		message: "Your pet's stay starts tomorrow",
		bookingId,
		startDate,
		tag: `reminder-${bookingId}`,
		url: `/customer/bookings/${bookingId}`,
	});
}

export async function notifyCareLogUpdate(
	userId: string,
	bookingId: string,
	careType: string
) {
	return dispatchNotification(userId, "carelog-update", {
		title: "Care Update",
		message: `New ${careType} care log added for your pet`,
		bookingId,
		careType,
		tag: `care-${bookingId}`,
		url: `/customer/bookings/${bookingId}`,
	});
}

export async function notifySecurityAlert(
	userId: string,
	message: string,
	severity: "low" | "medium" | "high" = "medium"
) {
	return dispatchNotification(userId, "security-alert", {
		title: "Security Alert",
		message,
		severity,
		tag: "security-alert",
		url: "/admin/security",
	});
}
