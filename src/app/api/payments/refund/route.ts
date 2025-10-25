import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { getStripeClient } from "~/lib/payments/stripe";
import { db } from "~/server/db";

const refundSchema = z.object({
	bookingId: z.string().min(1, "Booking ID is required"),
	amount: z.number().positive("Amount must be positive").optional(),
	reason: z.string().min(1, "Reason is required"),
	refundType: z.enum(["full", "partial"]),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { bookingId, amount, reason, refundType } = refundSchema.parse(body);

		// Check permissions - only admin/owner can process refunds
		const userRole = (session.user as { role?: string })?.role;
		const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Insufficient permissions to process refunds" },
				{ status: 403 }
			);
		}

		// Fetch booking with payment information
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: true,
				pet: true,
				kennel: true,
				payments: {
					where: { status: "SUCCEEDED" },
					orderBy: { createdAt: "desc" },
				},
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking not found" },
				{ status: 404 }
			);
		}

		if (booking.payments.length === 0) {
			return NextResponse.json(
				{ error: "No successful payments found for this booking" },
				{ status: 400 }
			);
		}

		const latestPayment = booking.payments[0];
		if (!latestPayment.stripePaymentIntentId) {
			return NextResponse.json(
				{ error: "No Stripe payment intent found for refund" },
				{ status: 400 }
			);
		}

		// Calculate refund amount
		const refundAmount = refundType === "full" 
			? Number(latestPayment.amount)
			: (amount || 0);

		if (refundAmount > Number(latestPayment.amount)) {
			return NextResponse.json(
				{ error: "Refund amount cannot exceed payment amount" },
				{ status: 400 }
			);
		}

		// Process refund with Stripe
		const stripe = getStripeClient();
		const refund = await stripe.refunds.create({
			payment_intent: latestPayment.stripePaymentIntentId,
			amount: Math.round(refundAmount * 100), // Convert to cents
			reason: "requested_by_customer",
			metadata: {
				bookingId,
				reason,
				processedBy: session.user.id,
			},
		});

		// Create refund record in database
		const refundRecord = await db.payment.create({
			data: {
				bookingId,
				amount: refundAmount,
				currency: latestPayment.currency,
				status: "PENDING",
				paymentMethod: "refund",
				stripePaymentIntentId: refund.id,
				metadata: {
					refundId: refund.id,
					originalPaymentId: latestPayment.id,
					reason,
					processedBy: session.user.id,
					refundType,
				},
			},
		});

		// Update booking status if full refund
		if (refundType === "full") {
			await db.booking.update({
				where: { id: bookingId },
				data: { status: "CANCELLED" },
			});
		}

		// Create audit log
		await db.auditLog.create({
			data: {
				actorId: session.user.id,
				action: "REFUND_PROCESSED",
				target: "payment",
				targetId: refundRecord.id,
				meta: {
					bookingId,
					refundAmount,
					reason,
					refundType,
					stripeRefundId: refund.id,
				},
			},
		});

		return NextResponse.json({
			success: true,
			refundId: refund.id,
			amount: refundAmount,
			status: refund.status,
		});
	} catch (error) {
		console.error("Refund processing error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to process refund" },
			{ status: 500 }
		);
	}
}
