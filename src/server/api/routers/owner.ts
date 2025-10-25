import { BookingStatus, type UserRole } from "@prisma/client";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";

type OwnerOverview = {
	revenue: {
		total: number;
		change: number;
	};
	users: {
		total: number;
		newThisMonth: number;
		byRole: Record<UserRole, number>;
	};
	system: {
		status: "healthy" | "attention" | "critical";
		notes: string[];
		occupancyRate: number;
	};
	audit: {
		last30Days: number;
		last24Hours: number;
	};
	operations: {
		expectedCheckIns: number;
		expectedCheckOuts: number;
		currentStays: number;
	};
};

const COMPLETED_REVENUE_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
	BookingStatus.CHECKED_OUT,
];

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

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
	new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		23,
		59,
		59,
		999
	);

const startOfMonth = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), 1);

export const ownerRouter = createTRPCRouter({
	overview: createRoleProtectedProcedure(["OWNER"]).query<OwnerOverview>(
		async ({ ctx }) => {
			const now = new Date();
			const currentMonthStart = startOfMonth(now);
			const previousMonthStart = startOfMonth(
				new Date(now.getFullYear(), now.getMonth() - 1, 1)
			);
			const _twoMonthsAgoStart = startOfMonth(
				new Date(now.getFullYear(), now.getMonth() - 2, 1)
			);

			const dayStart = startOfDay(now);
			const dayEnd = endOfDay(now);
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

			const [
				currentRevenue,
				previousRevenue,
				totalUsers,
				newUsersThisMonth,
				usersByRoleList,
				auditLast30,
				auditLast24,
				activeBookingCount,
				activeKennelCount,
				expectedCheckIns,
				expectedCheckOuts,
			] = await ctx.db.$transaction([
				ctx.db.booking.aggregate({
					_sum: { price: true },
					where: {
						status: { in: COMPLETED_REVENUE_STATUSES },
						startDate: { gte: currentMonthStart, lte: dayEnd },
					},
				}),
				ctx.db.booking.aggregate({
					_sum: { price: true },
					where: {
						status: { in: COMPLETED_REVENUE_STATUSES },
						startDate: { gte: previousMonthStart, lt: currentMonthStart },
					},
				}),
				ctx.db.user.count(),
				ctx.db.user.count({
					where: { createdAt: { gte: currentMonthStart } },
				}),
				ctx.db.user.findMany({
					select: { role: true },
				}),
				ctx.db.auditLog.count({
					where: { timestamp: { gte: thirtyDaysAgo, lte: dayEnd } },
				}),
				ctx.db.auditLog.count({
					where: { timestamp: { gte: twentyFourHoursAgo, lte: dayEnd } },
				}),
				ctx.db.booking.count({
					where: {
						status: { in: ACTIVE_BOOKING_STATUSES },
						startDate: { lte: dayEnd },
						endDate: { gte: dayStart },
					},
				}),
				ctx.db.kennel.count({
					where: { isActive: true },
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

			const totalRevenue = Number(currentRevenue._sum.price ?? 0);
			const previousRevenueTotal = Number(previousRevenue._sum.price ?? 0);
			const revenueChange =
				previousRevenueTotal === 0
					? totalRevenue === 0
						? 0
						: 100
					: ((totalRevenue - previousRevenueTotal) / previousRevenueTotal) *
						100;

			const usersByRoleMap = usersByRoleList.reduce<Record<UserRole, number>>(
				(acc, item) => {
					const role = item.role as UserRole;
					acc[role] = (acc[role] ?? 0) + 1;
					return acc;
				},
				{
					OWNER: 0,
					ADMIN: 0,
					STAFF: 0,
					CUSTOMER: 0,
				}
			);

			const occupancyRate =
				activeKennelCount === 0
					? 0
					: Math.min(1, activeBookingCount / activeKennelCount);

			let systemStatus: OwnerOverview["system"]["status"] = "healthy";
			const notes: string[] = [];

			if (occupancyRate > 0.95) {
				systemStatus = "attention";
				notes.push("Kennel occupancy above 95%");
			} else if (occupancyRate < 0.4) {
				systemStatus = "attention";
				notes.push("Kennel occupancy below 40%");
			}

			if (auditLast24 > 200) {
				systemStatus = "attention";
				notes.push("Audit log volume elevated in the last 24 hours");
			}

			if (auditLast24 > 500) {
				systemStatus = "critical";
				notes.push(
					"Investigate potential anomalous activity; audit volume unusually high"
				);
			}

			return {
				revenue: {
					total: Math.round(totalRevenue * 100) / 100,
					change: Math.round(revenueChange * 10) / 10,
				},
				users: {
					total: totalUsers,
					newThisMonth: newUsersThisMonth,
					byRole: usersByRoleMap,
				},
				system: {
					status: systemStatus,
					notes,
					occupancyRate,
				},
				audit: {
					last30Days: auditLast30,
					last24Hours: auditLast24,
				},
				operations: {
					expectedCheckIns,
					expectedCheckOuts,
					currentStays: activeBookingCount,
				},
			};
		}
	),
});
