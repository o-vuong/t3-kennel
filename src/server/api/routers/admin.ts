import { BookingStatus } from "@prisma/client";

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
});
