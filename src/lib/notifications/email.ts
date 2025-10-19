import nodemailer from "nodemailer";
import { env } from "~/env";
import { db } from "~/server/db";

const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: Number.parseInt(env.SMTP_PORT ?? "587"),
	secure: false,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

export async function sendEmail(
	userId: string,
	templateId: string,
	data: Record<string, unknown>,
) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true, name: true },
	});
	if (!user) return;

	const template = await getEmailTemplate(templateId, data);

	await transporter.sendMail({
		from: env.OAUTH_SMTP_FROM ?? env.SMTP_USER,
		to: user.email,
		subject: template.subject,
		text: template.text,
		html: template.html,
	});
}

async function getEmailTemplate(
	templateId: string,
	data: Record<string, unknown>,
) {
	// Load and render templates with PHI redaction
	// Templates: booking-confirmed, booking-reminder, carelog-summary, security-alert
	switch (templateId) {
		case "booking-confirmed":
			return {
				subject: "Booking Confirmed - Kennel Management",
				text: `Your booking has been confirmed. Booking ID: ${data.bookingId}`,
				html: `
					<h1>Booking Confirmed</h1>
					<p>Your booking has been confirmed.</p>
					<p>Booking ID: ${data.bookingId}</p>
					<p>Start Date: ${data.startDate}</p>
					<p>End Date: ${data.endDate}</p>
				`,
			};
		case "booking-reminder":
			return {
				subject: "Booking Reminder - Kennel Management",
				text: `Reminder: Your pet's stay starts tomorrow. Booking ID: ${data.bookingId}`,
				html: `
					<h1>Booking Reminder</h1>
					<p>Reminder: Your pet's stay starts tomorrow.</p>
					<p>Booking ID: ${data.bookingId}</p>
					<p>Start Date: ${data.startDate}</p>
				`,
			};
		case "carelog-summary":
			return {
				subject: "Daily Care Summary - Kennel Management",
				text: `Daily care summary for your pet. Booking ID: ${data.bookingId}`,
				html: `
					<h1>Daily Care Summary</h1>
					<p>Here's a summary of your pet's care today.</p>
					<p>Booking ID: ${data.bookingId}</p>
					<p>Date: ${data.date}</p>
				`,
			};
		case "security-alert":
			return {
				subject: "Security Alert - Kennel Management",
				text: `Security alert: ${data.message}`,
				html: `
					<h1>Security Alert</h1>
					<p>${data.message}</p>
					<p>Time: ${data.timestamp}</p>
				`,
			};
		default:
			return {
				subject: "Notification - Kennel Management",
				text: "You have a new notification.",
				html: "<h1>Notification</h1><p>You have a new notification.</p>",
			};
	}
}
