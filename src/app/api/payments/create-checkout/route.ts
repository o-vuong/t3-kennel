import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { getStripeClient } from "~/lib/payments/stripe";
import { db } from "~/server/db";

const createCheckoutSchema = z.object({
	bookingId: z.string().min(1, "Booking ID is required"),
	amount: z.number().positive("Amount must be positive"),
	currency: z.string().default("usd"),
	successUrl: z.string().url("Invalid success URL"),
	cancelUrl: z.string().url("Invalid cancel URL"),
	description: z.string().optional(),
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
		const { bookingId, amount, currency, successUrl, cancelUrl, description } = 
			createCheckoutSchema.parse(body);

		// Verify booking exists and belongs to user (or user has permission)
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: true,
				kennel: true,
				pet: true,
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking not found" },
				{ status: 404 }
			);
		}

		// Check permissions - customer can only pay for their own bookings
		// Admin/Owner can pay for any booking
		const userRole = (session.user as { role?: string })?.role;
		const isCustomer = userRole === "CUSTOMER";
		const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

		if (isCustomer && booking.customerId !== session.user.id) {
			return NextResponse.json(
				{ error: "Unauthorized to pay for this booking" },
				{ status: 403 }
			);
		}

		if (!isCustomer && !isAdmin) {
			return NextResponse.json(
				{ error: "Insufficient permissions" },
				{ status: 403 }
			);
		}

		const stripe = getStripeClient();

		// Create checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency,
						product_data: {
							name: `Kennel Booking - ${booking.pet.name}`,
							description: description || `Booking for ${booking.pet.name} in ${booking.kennel.name}`,
						},
						unit_amount: Math.round(amount * 100), // Convert to cents
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: successUrl,
			cancel_url: cancelUrl,
			client_reference_id: bookingId,
			customer_email: booking.customer.email,
			metadata: {
				bookingId,
				petName: booking.pet.name,
				kennelName: booking.kennel.name,
				startDate: booking.startDate.toISOString(),
				endDate: booking.endDate.toISOString(),
			},
		});

		// Store checkout session ID in booking for tracking
		await db.booking.update({
			where: { id: bookingId },
			data: {
				metadata: {
					...booking.metadata,
					stripeCheckoutSessionId: checkoutSession.id,
				},
			},
		});

		return NextResponse.json({
			checkoutUrl: checkoutSession.url,
			sessionId: checkoutSession.id,
		});
	} catch (error) {
		console.error("Checkout session creation error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 }
		);
	}
}
