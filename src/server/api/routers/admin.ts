import { createHmac, randomBytes } from "node:crypto";

import {
	AuditAction,
	BookingStatus,
	OverrideScope,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
		expectedCheckIns: number;
		expectedCheckOuts: number;
		currentStays: number;
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

const CHECK_IN_ELIGIBLE_STATUSES: BookingStatus[] = [
	BookingStatus.PENDING,
	BookingStatus.CONFIRMED,
];

const CHECK_OUT_ELIGIBLE_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

const COMPLETED_REVENUE_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
	BookingStatus.CHECKED_OUT,
];

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const sixMonthsWindowStart = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth() - 5, 1);

const monthId = (value: Date) =>
	`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const humanMonth = (value: Date) =>
	`${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`;

const issueOverrideTokenInput = z.object({
	issuedToUserId: z.string().cuid().optional(),
	scope: z.enum([
		"BOOKING_CAPACITY",
		"PRICING",
		"POLICY_BYPASS",
		"REFUND",
		"DEPOSIT_WAIVER",
		"ADMIN_ACTION",
	]),
	expiresInMinutes: z
		.number()
		.int()
		.min(1)
		.max(60)
		.default(15),
});

const revokeOverrideTokenInput = z.object({
	token: z.string().min(1),
});

const approveRefundInput = z.object({
	bookingId: z.string().cuid(),
	amount: z.number().nonnegative(),
	reason: z.string().min(3).max(500),
});

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
			expectedCheckIns,
			expectedCheckOuts,
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
			ctx.db.booking.count({
				where: {
					startDate: { gte: dayStart, lte: dayEnd },
					status: { in: CHECK_IN_ELIGIBLE_STATUSES },
				},
			}),
			ctx.db.booking.count({
				where: {
					endDate: { gte: dayStart, lte: dayEnd },
					status: { in: CHECK_OUT_ELIGIBLE_STATUSES },
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
				expectedCheckIns,
				expectedCheckOuts,
				currentStays: activeKennelBookings,
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
		.input(issueOverrideTokenInput)
		.mutation(async ({ ctx, input }) => {
			const tokenValue = randomBytes(32).toString("base64url");
			const scope = input.scope as OverrideScope;
			const secret = process.env.OVERRIDE_TOKEN_SECRET;
			const signature = secret
				? createHmac("sha256", secret).update(tokenValue).digest("base64url")
				: undefined;
			const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000);

			const approvalToken = await ctx.db.$transaction(async (tx) => {
				const createdToken = await tx.approvalToken.create({
					data: {
						token: tokenValue,
						scope,
						expiresAt,
						issuedByAdminId: ctx.session.user.id,
						issuedToUserId: input.issuedToUserId ?? null,
						metadata: signature
							? {
									signature,
							  }
							: undefined,
					},
				});

				const audit = await tx.auditLog.create({
					data: {
						actorId: ctx.session.user.id,
						action: AuditAction.APPROVAL,
						target: `approvalToken:${createdToken.id}`,
						meta: {
							action: "issue_override_token",
							scope,
							issuedToUserId: input.issuedToUserId ?? null,
							expiresAt: createdToken.expiresAt.toISOString(),
						},
					},
				});

				await tx.overrideEvent.create({
					data: {
						actorId: ctx.session.user.id,
						scope: OverrideScope.ADMIN_ACTION,
						reason: `Override token issued for scope ${scope}`,
						entityType: "approvalToken",
						entityId: createdToken.id,
						approvedByAdminId: ctx.session.user.id,
						ownerOverride: ctx.session.user.role === "OWNER",
						metadata: {
							issuedToUserId: input.issuedToUserId ?? null,
							auditLogId: audit.id,
							expiresAt: createdToken.expiresAt.toISOString(),
							scope,
							hasSignature: Boolean(signature),
							...(signature ? { signature } : {}),
						},
					},
				});

				return createdToken;
			});

			return {
				token: tokenValue,
				expiresAt: approvalToken.expiresAt,
			};
		}),

	revokeOverrideToken: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(revokeOverrideTokenInput)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.approvalToken.findUnique({
				where: { token: input.token },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Override token not found",
				});
			}

			if (!existing.revokedAt) {
				await ctx.db.$transaction(async (tx) => {
					const revokedToken = await tx.approvalToken.update({
						where: { id: existing.id },
						data: {
							revokedAt: new Date(),
						},
					});

					await tx.auditLog.create({
						data: {
							actorId: ctx.session.user.id,
							action: AuditAction.APPROVAL,
							target: `approvalToken:${revokedToken.id}`,
							meta: {
								action: "revoke_override_token",
								scope: revokedToken.scope,
								timestamp: revokedToken.revokedAt?.toISOString(),
							},
						},
					});
				});
			}

			return { success: true };
		}),

	approveRefund: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(approveRefundInput)
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.db.$transaction(async (tx) => {
				const booking = await tx.booking.findUnique({
					where: { id: input.bookingId },
					select: { id: true, notes: true },
				});

				if (!booking) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Booking not found",
					});
				}

				const appendLine = `[${
					now.toISOString()
				}] Refund approved by ${ctx.session.user.id} for $${input.amount.toFixed(
					2,
				)} – ${input.reason}`;
				const appendedNote = [booking.notes?.trim(), appendLine]
					.filter(Boolean)
					.join("\n\n");

				await tx.booking.update({
					where: { id: booking.id },
					data: { notes: appendedNote },
				});

				const audit = await tx.auditLog.create({
					data: {
						actorId: ctx.session.user.id,
						action: AuditAction.REFUND,
						target: `booking:${booking.id}`,
						meta: {
							action: "approve_refund",
							amount: input.amount,
							reason: input.reason,
							timestamp: now.toISOString(),
						},
					},
				});

				await tx.overrideEvent.create({
					data: {
						actorId: ctx.session.user.id,
						scope: OverrideScope.REFUND,
						reason: input.reason,
						entityType: "booking",
						entityId: booking.id,
						approvedByAdminId: ctx.session.user.id,
						ownerOverride: ctx.session.user.role === "OWNER",
						metadata: {
							amount: input.amount,
							reason: input.reason,
							auditLogId: audit.id,
							approvedAt: now.toISOString(),
						},
					},
				});

				return { success: true };
			});
		}),
});
