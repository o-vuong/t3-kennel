import { db } from "~/server/db";
import { sendPushNotification } from "./push";
import { sendEmailNotification } from "./email";

export interface NotificationTrigger {
	event: string;
	userId: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	actionUrl?: string;
	metadata?: Record<string, any>;
}

export class NotificationService {
	async triggerNotification(trigger: NotificationTrigger): Promise<void> {
		try {
			// Create notification record in database
			await db.notification.create({
				data: {
					userId: trigger.userId,
					title: trigger.title,
					message: trigger.message,
					type: trigger.type,
					actionUrl: trigger.actionUrl,
					metadata: trigger.metadata,
					read: false,
				},
			});

			// Get user's push subscription
			const pushSubscription = await db.pushSubscription.findFirst({
				where: { userId: trigger.userId },
			});

			// Send push notification if subscription exists
			if (pushSubscription) {
				await sendPushNotification({
					subscription: {
						endpoint: pushSubscription.endpoint,
						keys: {
							p256dh: pushSubscription.p256dhKey,
							auth: pushSubscription.authKey,
						},
					},
					payload: {
						title: trigger.title,
						body: trigger.message,
						icon: "/icons/icon-192x192.png",
						badge: "/icons/badge-72x72.png",
						data: {
							url: trigger.actionUrl,
							event: trigger.event,
						},
					},
				});
			}

			// Send email notification for important events
			if (this.shouldSendEmail(trigger.event)) {
				await sendEmailNotification({
					userId: trigger.userId,
					subject: trigger.title,
					body: trigger.message,
					actionUrl: trigger.actionUrl,
				});
			}
		} catch (error) {
			console.error("Failed to trigger notification:", error);
		}
	}

	async triggerBookingCreated(bookingId: string, customerId: string): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "booking_created",
			userId: customerId,
			title: "Booking Confirmed",
			message: `Your booking for ${booking.pet.name} has been confirmed for ${booking.kennel?.name || "kennel"}.`,
			type: "success",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, petName: booking.pet.name },
		});

		// Notify staff
		const staffUsers = await db.user.findMany({
			where: {
				role: { in: ["STAFF", "ADMIN", "OWNER"] },
			},
		});

		for (const staff of staffUsers) {
			await this.triggerNotification({
				event: "booking_created",
				userId: staff.id,
				title: "New Booking",
				message: `New booking for ${booking.pet.name} in ${booking.kennel?.name || "kennel"}.`,
				type: "info",
				actionUrl: `/admin/bookings/${bookingId}`,
				metadata: { bookingId, petName: booking.pet.name },
			});
		}
	}

	async triggerBookingCancelled(bookingId: string, customerId: string): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "booking_cancelled",
			userId: customerId,
			title: "Booking Cancelled",
			message: `Your booking for ${booking.pet.name} has been cancelled.`,
			type: "info",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, petName: booking.pet.name },
		});

		// Notify staff
		const staffUsers = await db.user.findMany({
			where: {
				role: { in: ["STAFF", "ADMIN", "OWNER"] },
			},
		});

		for (const staff of staffUsers) {
			await this.triggerNotification({
				event: "booking_cancelled",
				userId: staff.id,
				title: "Booking Cancelled",
				message: `Booking for ${booking.pet.name} has been cancelled.`,
				type: "warning",
				actionUrl: `/admin/bookings/${bookingId}`,
				metadata: { bookingId, petName: booking.pet.name },
			});
		}
	}

	async triggerPaymentReceived(bookingId: string, customerId: string, amount: number): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "payment_received",
			userId: customerId,
			title: "Payment Received",
			message: `Payment of $${amount.toFixed(2)} has been received for your booking.`,
			type: "success",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, amount },
		});

		// Notify admin/owner
		const adminUsers = await db.user.findMany({
			where: {
				role: { in: ["ADMIN", "OWNER"] },
			},
		});

		for (const admin of adminUsers) {
			await this.triggerNotification({
				event: "payment_received",
				userId: admin.id,
				title: "Payment Received",
				message: `Payment of $${amount.toFixed(2)} received for booking ${bookingId}.`,
				type: "success",
				actionUrl: `/admin/bookings/${bookingId}`,
				metadata: { bookingId, amount },
			});
		}
	}

	async triggerCareLogAdded(bookingId: string, customerId: string, activity: string): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "care_log_added",
			userId: customerId,
			title: "Care Update",
			message: `New care log added for ${booking.pet.name}: ${activity}`,
			type: "info",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, petName: booking.pet.name, activity },
		});
	}

	async triggerPetCheckedIn(bookingId: string, customerId: string): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "pet_checked_in",
			userId: customerId,
			title: "Pet Checked In",
			message: `${booking.pet.name} has been checked in to ${booking.kennel?.name || "kennel"}.`,
			type: "success",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, petName: booking.pet.name },
		});
	}

	async triggerPetCheckedOut(bookingId: string, customerId: string): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "pet_checked_out",
			userId: customerId,
			title: "Pet Checked Out",
			message: `${booking.pet.name} has been checked out and is ready for pickup.`,
			type: "success",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, petName: booking.pet.name },
		});
	}

	async triggerRefundProcessed(bookingId: string, customerId: string, amount: number): Promise<void> {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { pet: true, kennel: true },
		});

		if (!booking) return;

		// Notify customer
		await this.triggerNotification({
			event: "refund_processed",
			userId: customerId,
			title: "Refund Processed",
			message: `Refund of $${amount.toFixed(2)} has been processed for your booking.`,
			type: "success",
			actionUrl: `/customer/bookings/${bookingId}`,
			metadata: { bookingId, amount },
		});
	}

	async triggerSystemAlert(alertType: string, message: string, severity: "low" | "medium" | "high"): Promise<void> {
		// Notify all admin/owner users
		const adminUsers = await db.user.findMany({
			where: {
				role: { in: ["ADMIN", "OWNER"] },
			},
		});

		for (const admin of adminUsers) {
			await this.triggerNotification({
				event: "system_alert",
				userId: admin.id,
				title: `System Alert: ${alertType}`,
				message,
				type: severity === "high" ? "error" : severity === "medium" ? "warning" : "info",
				actionUrl: "/admin/system",
				metadata: { alertType, severity },
			});
		}
	}

	private shouldSendEmail(event: string): boolean {
		const emailEvents = [
			"booking_created",
			"booking_cancelled",
			"payment_received",
			"refund_processed",
			"system_alert",
		];
		return emailEvents.includes(event);
	}
}

export const notificationService = new NotificationService();
