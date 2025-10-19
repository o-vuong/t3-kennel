import { AuditAction, BookingStatus, OverrideScope } from "@prisma/client";
import { createHmac } from "node:crypto";

import { z } from "zod";
import {
	createRoleProtectedProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";

type AdminOverview = {
	metrics: {
		todaysBookings: number;
		activeStaff: number;
		revenueToday: number;
		occupancyRate: number;
	};
	monthlyRevenue: Array<{
		id: string;
		label: string;
		revenue: number;
		bookings: number;
	}>;
};

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

const COMPLETED_REVENUE_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
	BookingStatus.CHECKED_OUT,
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const sixMonthsWindowStart = (date: Date) => new Date(date.getFullYear(), date.getMonth() - 5, 1);

const monthId = (value: Date) =>
	`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const humanMonth = (value: Date) =>
	`${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`;

export const adminRouter = createTRPCRouter({
	overview: createRoleProtectedProcedure(["OWNER", "ADMIN"]).query<
		AdminOverview
	>(async ({ ctx }) => {
		const now = new Date();
		const dayStart = startOfDay(now);
		const dayEnd = endOfDay(now);
		const sixMonthsAgo = sixMonthsWindowStart(now);

		const [
			todaysBookings,
			activeStaff,
			revenueAggregate,
			activeKennelBookings,
			totalKennels,
			recentBookings,
		] = await ctx.db.$transaction([
			ctx.db.booking.count({
				where: {
					startDate: { lte: dayEnd },
					endDate: { gte: dayStart },
				},
			}),
			ctx.db.user.count({
				where: { role: "STAFF" },
			}),
			ctx.db.booking.aggregate({
				_sum: { price: true },
				where: {
					status: { in: COMPLETED_REVENUE_STATUSES },
					startDate: { gte: dayStart, lte: dayEnd },
				},
			}),
			ctx.db.booking.count({
				where: {
					status: { in: ACTIVE_BOOKING_STATUSES },
					startDate: { lte: now },
					endDate: { gt: now },
				},
			}),
			ctx.db.kennel.count({
				where: { isActive: true },
			}),
			ctx.db.booking.findMany({
				where: {
					startDate: { gte: sixMonthsAgo, lte: dayEnd },
				},
				select: {
					startDate: true,
					price: true,
				},
			}),
		]);

		const revenueToday = Number(revenueAggregate._sum.price ?? 0);
		const occupancyRate =
			totalKennels === 0
				? 0
				: Math.min(1, activeKennelBookings / totalKennels);

		const revenueByMonth = new Map<
			string,
			{ label: string; revenue: number; bookings: number }
		>();

		for (let i = 0; i < 6; i += 1) {
			const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
			revenueByMonth.set(monthId(date), {
				label: humanMonth(date),
				revenue: 0,
				bookings: 0,
			});
		}

		recentBookings.forEach((booking) => {
			const date = booking.startDate;
			const id = monthId(date);
			const bucket = revenueByMonth.get(id);
			if (!bucket) {
				return;
			}

			bucket.revenue += Number(booking.price);
			bucket.bookings += 1;
		});

		return {
			metrics: {
				todaysBookings,
				activeStaff,
				revenueToday,
				occupancyRate,
			},
			monthlyRevenue: Array.from(revenueByMonth.entries()).map(
				([id, value]) => ({
					id,
					label: value.label,
					revenue: Math.round(value.revenue * 100) / 100,
					bookings: value.bookings,
				}),
			),
		};
	}),

	issueOverrideToken: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(
			z.object({
				issuedToUserId: z.string().cuid().optional(),
				scope: z.nativeEnum(OverrideScope),
				expiresInMinutes: z.number().int().min(1).max(60).default(15),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Generate cryptographically random token (32 bytes base64url)
			const tokenBytes = new Uint8Array(32);
			crypto.getRandomValues(tokenBytes);
			const token = Buffer.from(tokenBytes).toString("base64url");

			// Calculate expiration time
			const expiresAt = new Date(
				Date.now() + input.expiresInMinutes * 60 * 1000,
			);

			// Store token metadata (HMAC signature if secret available)
			const metadata: Record<string, string> = {
				issuedAt: new Date().toISOString(),
			};

			// If OVERRIDE_TOKEN_SECRET is available, compute HMAC signature
			const secret = process.env.OVERRIDE_TOKEN_SECRET;
			if (secret) {
				const hmac = createHmac("sha256", secret);
				hmac.update(token);
				metadata.signature = hmac.digest("hex");
			}

			// Create the approval token
			const approvalToken = await ctx.db.approvalToken.create({
				data: {
					token,
					scope: input.scope,
					expiresAt,
					issuedByAdminId: ctx.session.user.id,
					issuedToUserId: input.issuedToUserId,
					metadata,
				},
			});

			// Create audit log
			await ctx.db.auditLog.create({
				data: {
					actorId: ctx.session.user.id,
					action: AuditAction.APPROVAL,
					target: `approvalToken:${approvalToken.id}`,
					meta: {
						scope: input.scope,
						issuedToUserId: input.issuedToUserId,
						expiresInMinutes: input.expiresInMinutes,
					},
				},
			});

			// Create override event
			await ctx.db.overrideEvent.create({
				data: {
					actorId: ctx.session.user.id,
					scope: OverrideScope.ADMIN_ACTION,
					reason: `Issued ${input.scope} override token`,
					entityType: "approvalToken",
					entityId: approvalToken.id,
					metadata: {
						scope: input.scope,
						expiresAt: expiresAt.toISOString(),
					},
				},
			});

			return {
				token,
				expiresAt,
			};
		}),

	revokeOverrideToken: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(
			z.object({
				token: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the token
			const approvalToken = await ctx.db.approvalToken.findUnique({
				where: { token: input.token },
			});

			if (!approvalToken) {
				throw new Error("Token not found");
			}

			// Revoke the token
			await ctx.db.approvalToken.update({
				where: { token: input.token },
				data: { revokedAt: new Date() },
			});

			// Create audit log
			await ctx.db.auditLog.create({
				data: {
					actorId: ctx.session.user.id,
					action: AuditAction.APPROVAL,
					target: `approvalToken:${approvalToken.id}`,
					meta: {
						action: "revoke",
						scope: approvalToken.scope,
					},
				},
			});

			return { success: true };
		}),

	approveRefund: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(
			z.object({
				bookingId: z.string().cuid(),
				amount: z.number().nonnegative(),
				reason: z.string().min(3).max(500),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify booking exists
			const booking = await ctx.db.booking.findUnique({
				where: { id: input.bookingId },
			});

			if (!booking) {
				throw new Error("Booking not found");
			}

			// Create audit log for refund
			await ctx.db.auditLog.create({
				data: {
					actorId: ctx.session.user.id,
					action: AuditAction.REFUND,
					target: `booking:${input.bookingId}`,
					meta: {
						amount: input.amount,
						reason: input.reason,
						approvedAt: new Date().toISOString(),
					},
				},
			});

			// Create override event for refund
			await ctx.db.overrideEvent.create({
				data: {
					actorId: ctx.session.user.id,
					scope: OverrideScope.REFUND,
					reason: input.reason,
					entityType: "booking",
					entityId: input.bookingId,
					approvedByAdminId: ctx.session.user.id,
					metadata: {
						amount: input.amount,
						reason: input.reason,
					},
				},
			});

			return { success: true };
		}),
});
