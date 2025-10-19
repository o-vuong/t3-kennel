import { AuditAction, BookingStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "~/env";
import { getStripeClient } from "~/lib/payments/stripe";
import { db } from "~/server/db";
import { dispatchNotification } from "~/server/notifications/dispatcher";

const stripe = getStripeClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function appendPaymentNote(bookingId: string, note: string) {
	const booking = await db.booking.findUnique({
		where: { id: bookingId },
		select: { notes: true },
	});

	if (!booking) {
		return;
	}

	const entries = [booking.notes?.trim(), note].filter(Boolean);
	await db.booking.update({
		where: { id: bookingId },
		data: { notes: entries.join("\n\n") },
	});
}

function decimalFromCents(amountCents: number | null | undefined) {
	const cents = amountCents ?? 0;
	return new Prisma.Decimal(cents).dividedBy(100);
}

function formatCurrency(amount: Prisma.Decimal, currency: string) {
	const numeric = Number(amount.toFixed(2));
	const code = currency?.toUpperCase() || "USD";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: code,
	}).format(numeric);
}

async function writeAuditLog(params: {
	bookingId: string;
	customerId: string;
	action: "payment_succeeded" | "payment_failed" | "payment_refunded";
	eventId: string;
	amount: Prisma.Decimal;
	currency: string;
	referenceId?: string | null;
	reason?: string | null;
}) {
	try {
		await db.auditLog.create({
			data: {
				actorId: params.customerId,
				action: AuditAction.UPDATE,
				target: `booking:${params.bookingId}`,
				meta: {
					event: params.action,
					eventId: params.eventId,
					amount: params.amount.toString(),
					currency: params.currency,
					referenceId: params.referenceId,
					reason: params.reason ?? undefined,
				},
			},
		});
	} catch (error) {
		console.error("Failed to write audit log", error);
	}
}

async function handleCheckoutCompleted(event: Stripe.Event) {
	const session = event.data.object as Stripe.Checkout.Session;
	const bookingId = session.metadata?.bookingId;
	const customerId = session.metadata?.customerId;

	if (!bookingId || !customerId) {
		console.warn(
			"Checkout session missing booking/customer metadata",
			session.id,
		);
		return;
	}

	const booking = await db.booking.findUnique({
		where: { id: bookingId },
		select: { id: true, status: true, customerId: true },
	});

	if (!booking) {
		console.warn("Booking not found for checkout session", bookingId);
		return;
	}

	const paymentIntentId =
		typeof session.payment_intent === "string"
			? session.payment_intent
			: (session.payment_intent?.id ?? null);

	const amount = decimalFromCents(session.amount_total);
	const paymentType = session.metadata?.paymentType ?? "deposit";
	const currency = session.currency ?? "usd";

	await db.payment.upsert({
		where: {
			stripeCheckoutSessionId: session.id,
		},
		update: {
			status: "succeeded",
			stripePaymentIntentId: paymentIntentId ?? undefined,
			amount,
			currency,
			metadata: {
				eventId: event.id,
				type: event.type,
				paymentType,
			},
		},
		create: {
			bookingId,
			stripeCheckoutSessionId: session.id,
			stripePaymentIntentId: paymentIntentId ?? undefined,
			amount,
			currency,
			status: "succeeded",
			type: paymentType,
			metadata: {
				eventId: event.id,
				type: event.type,
			},
		},
	});

	if (booking.status === BookingStatus.PENDING) {
		await db.booking.update({
			where: { id: bookingId },
			data: {
				status: BookingStatus.CONFIRMED,
			},
		});
	}

	await appendPaymentNote(
		bookingId,
		`[${new Date().toISOString()}] ${paymentType.toUpperCase()} payment of ${amount.toString()} ${currency.toUpperCase()} confirmed via Stripe session ${session.id}.`,
	);

	await writeAuditLog({
		bookingId,
		customerId: booking.customerId,
		action: "payment_succeeded",
		eventId: event.id,
		amount,
		currency,
		referenceId: session.id,
	});

	await dispatchNotification({
		userId: booking.customerId,
		type: "payment_succeeded",
		title: "Deposit received",
		message: `We received your ${formatCurrency(amount, currency)} ${paymentType} payment for booking ${bookingId}.`,
		payload: {
			bookingId,
			stripeSessionId: session.id,
			paymentType,
			amount: amount.toString(),
			currency,
		},
	});
}

async function handlePaymentFailed(event: Stripe.Event) {
	const paymentIntent = event.data.object as Stripe.PaymentIntent;
	const bookingId = paymentIntent.metadata?.bookingId;
	const customerId = paymentIntent.metadata?.customerId;

	if (!bookingId || !customerId) {
		console.warn(
			"Payment intent missing booking/customer metadata",
			paymentIntent.id,
		);
		return;
	}

	const amount = decimalFromCents(paymentIntent.amount);
	const paymentType = paymentIntent.metadata?.paymentType ?? "deposit";
	const currency = paymentIntent.currency ?? "usd";

	await db.payment.upsert({
		where: {
			stripePaymentIntentId: paymentIntent.id,
		},
		update: {
			status: "failed",
			metadata: {
				eventId: event.id,
				type: event.type,
				lastError: paymentIntent.last_payment_error
					? {
							code: paymentIntent.last_payment_error.code,
							message: paymentIntent.last_payment_error.message,
						}
					: undefined,
			},
		},
		create: {
			bookingId,
			stripePaymentIntentId: paymentIntent.id,
			amount,
			currency,
			status: "failed",
			type: paymentType,
			metadata: {
				eventId: event.id,
				type: event.type,
			},
		},
	});

	await appendPaymentNote(
		bookingId,
		`[${new Date().toISOString()}] ${paymentType.toUpperCase()} payment failed via Stripe intent ${paymentIntent.id}. Reason: ${paymentIntent.last_payment_error?.message ?? "Unknown"}.`,
	);

	await writeAuditLog({
		bookingId,
		customerId,
		action: "payment_failed",
		eventId: event.id,
		amount,
		currency,
		referenceId: paymentIntent.id,
		reason: paymentIntent.last_payment_error?.message ?? null,
	});

	await dispatchNotification({
		userId: customerId,
		type: "payment_failed",
		title: "Payment failed",
		message: `We couldn't process your ${paymentType} payment for booking ${bookingId}. ${paymentIntent.last_payment_error?.message ?? "Please update your payment method."}`,
		payload: {
			bookingId,
			stripePaymentIntentId: paymentIntent.id,
			paymentType,
			amount: amount.toString(),
			currency,
		},
	});
}

export async function POST(request: Request) {
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		return NextResponse.json(
			{ error: "Missing Stripe signature" },
			{ status: 400 },
		);
	}

	const payload = await request.text();
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			payload,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown Stripe webhook error";
		console.error("Stripe webhook signature verification failed", message);
		return NextResponse.json(
			{ error: `Webhook Error: ${message}` },
			{ status: 400 },
		);
	}

	try {
		switch (event.type) {
			case "checkout.session.completed":
				await handleCheckoutCompleted(event);
				break;
			case "payment_intent.payment_failed":
				await handlePaymentFailed(event);
				break;
			default:
				break;
		}
	} catch (error) {
		console.error("Stripe webhook handler failure", event.type, error);
		return NextResponse.json(
			{ error: "Webhook handler error" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ received: true });
}
