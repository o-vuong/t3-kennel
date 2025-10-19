import { BookingStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import { getStripeClient } from "~/lib/payments/stripe";
import { parseUserRole } from "~/lib/auth/roles";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const paymentsRouter = createTRPCRouter({
	createBookingCheckout: protectedProcedure
		.input(
			z.object({
				bookingId: z.string().cuid(),
				successUrl: z.string().url().optional(),
				cancelUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const role = parseUserRole((ctx.session.user as { role?: unknown })?.role);
			if (role !== "CUSTOMER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only customers can initiate booking payments",
				});
			}

			const booking = await ctx.db.booking.findUnique({
				where: { id: input.bookingId },
				include: {
					pet: {
						select: { name: true },
					},
				},
			});

			if (!booking || booking.customerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Booking not found",
				});
			}

			if (booking.status === BookingStatus.CANCELLED) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cancelled bookings cannot be paid",
				});
			}

			const amountCents = Math.round(Number(booking.price) * 100);

			if (amountCents <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Booking total must be greater than zero to create a payment",
				});
			}

			const stripe = getStripeClient();
			const successUrl =
				input.successUrl ??
				`${env.NEXT_PUBLIC_APP_URL}/customer/bookings?checkout=success`;
			const cancelUrl =
				input.cancelUrl ??
				`${env.NEXT_PUBLIC_APP_URL}/customer/bookings?checkout=cancelled`;

			const session = await stripe.checkout.sessions.create({
				mode: "payment",
				payment_method_types: ["card"],
				customer_email: ctx.session.user.email ?? undefined,
				allow_promotion_codes: true,
				metadata: {
					bookingId: booking.id,
					customerId: ctx.session.user.id,
					paymentType: "deposit",
				},
				payment_intent_data: {
					metadata: {
						bookingId: booking.id,
						customerId: ctx.session.user.id,
						paymentType: "deposit",
					},
				},
				line_items: [
					{
						price_data: {
							currency: "usd",
							unit_amount: amountCents,
							product_data: {
								name: `Kennel stay for ${booking.pet?.name ?? "your pet"}`,
							},
						},
						quantity: 1,
					},
				],
				success_url: successUrl,
				cancel_url: cancelUrl,
			});

			if (!session.url) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Stripe did not return a checkout URL",
				});
			}

			return {
				sessionId: session.id,
				checkoutUrl: session.url,
			};
		}),
});
