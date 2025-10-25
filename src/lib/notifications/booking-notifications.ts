import { BookingStatus } from "@prisma/client";
import { db } from "~/server/db";
import { dispatchNotification } from "./dispatcher";

export async function sendBookingStatusNotification(
	bookingId: string,
	newStatus: BookingStatus,
	_previousStatus?: BookingStatus,
	note?: string
) {
	try {
		// Get booking details with customer and pet information
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: {
					select: { id: true, email: true, name: true },
				},
				pet: {
					select: { name: true, breed: true },
				},
				kennel: {
					select: { name: true },
				},
			},
		});

		if (!booking) {
			console.error(`Booking ${bookingId} not found for notification`);
			return;
		}

		const { customer, pet, kennel } = booking;
		const customerName = customer.name || customer.email.split("@")[0];

		// Generate notification content based on status change
		let title: string;
		let message: string;
		let priority: "low" | "normal" | "high" = "normal";

		switch (newStatus) {
			case BookingStatus.CONFIRMED:
				title = "Booking Confirmed! 🎉";
				message = `Your booking for ${pet.name} at ${kennel.name} has been confirmed for ${booking.startDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}.`;
				break;

			case BookingStatus.CHECKED_IN:
				title = "Pet Checked In ✅";
				message = `${pet.name} has been checked in to ${kennel.name}. We'll take great care of your furry friend!`;
				break;

			case BookingStatus.CHECKED_OUT:
				title = "Pet Checked Out 🏠";
				message = `${pet.name} has been checked out from ${kennel.name}. Thank you for choosing our services!`;
				break;

			case BookingStatus.CANCELLED:
				title = "Booking Cancelled";
				message = `Your booking for ${pet.name} at ${kennel.name} has been cancelled.`;
				if (note) {
					message += ` Reason: ${note}`;
				}
				priority = "high";
				break;

			case BookingStatus.NO_SHOW:
				title = "No Show - Booking Updated";
				message = `Your booking for ${pet.name} at ${kennel.name} has been marked as no show. Please contact us if you need to reschedule.`;
				priority = "high";
				break;

			default:
				title = "Booking Status Updated";
				message = `Your booking for ${pet.name} at ${kennel.name} status has been updated to ${newStatus.toLowerCase().replace("_", " ")}.`;
		}

		// Send notification to customer
		await dispatchNotification(customer.id, "booking_status_update", {
			title,
			message,
			priority,
			bookingId,
			petName: pet.name,
			kennelName: kennel.name,
			status: newStatus,
			startDate: booking.startDate.toISOString(),
			endDate: booking.endDate.toISOString(),
			note,
		});

		// Also notify staff/admin if it's a concerning status change
		if (
			newStatus === BookingStatus.CANCELLED ||
			newStatus === BookingStatus.NO_SHOW
		) {
			// Get all staff and admin users
			const staffUsers = await db.user.findMany({
				where: {
					role: { in: ["STAFF", "ADMIN", "OWNER"] },
				},
				select: { id: true },
			});

			// Send notification to all staff
			for (const user of staffUsers) {
				await dispatchNotification(user.id, "booking_alert", {
					title: "Booking Alert - Action Required",
					message: `Booking for ${pet.name} (${customerName}) has been ${newStatus.toLowerCase().replace("_", " ")}.`,
					priority: "high",
					bookingId,
					customerName,
					petName: pet.name,
					status: newStatus,
				});
			}
		}

		console.log(
			`Booking status notification sent for booking ${bookingId}: ${newStatus}`
		);
	} catch (error) {
		console.error(
			`Failed to send booking status notification for ${bookingId}:`,
			error
		);
	}
}

export async function sendBookingReminderNotification(
	bookingId: string,
	reminderType: "upcoming" | "check_in" | "check_out"
) {
	try {
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: {
					select: { id: true, email: true, name: true },
				},
				pet: {
					select: { name: true },
				},
				kennel: {
					select: { name: true },
				},
			},
		});

		if (!booking) {
			console.error(`Booking ${bookingId} not found for reminder notification`);
			return;
		}

		const { customer, pet, kennel } = booking;
		const _customerName = customer.name || customer.email.split("@")[0];

		let title: string;
		let message: string;

		switch (reminderType) {
			case "upcoming":
				title = "Upcoming Booking Reminder 📅";
				message = `Reminder: ${pet.name} has a booking at ${kennel.name} starting ${booking.startDate.toLocaleDateString()}.`;
				break;

			case "check_in":
				title = "Check-in Reminder 🚪";
				message = `Don't forget: ${pet.name} is scheduled to check in at ${kennel.name} today at ${booking.startDate.toLocaleTimeString()}.`;
				break;

			case "check_out":
				title = "Check-out Reminder 🏠";
				message = `Reminder: ${pet.name} is scheduled to check out from ${kennel.name} today at ${booking.endDate.toLocaleTimeString()}.`;
				break;
		}

		await dispatchNotification(customer.id, "booking_reminder", {
			title,
			message,
			priority: "normal",
			bookingId,
			petName: pet.name,
			kennelName: kennel.name,
			reminderType,
			startDate: booking.startDate.toISOString(),
			endDate: booking.endDate.toISOString(),
		});

		console.log(
			`Booking reminder notification sent for booking ${bookingId}: ${reminderType}`
		);
	} catch (error) {
		console.error(
			`Failed to send booking reminder notification for ${bookingId}:`,
			error
		);
	}
}
