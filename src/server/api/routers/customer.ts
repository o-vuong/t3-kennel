import { BookingStatus } from "@prisma/client";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";

type CustomerActivityEntry = {
	id: string;
	title: string;
	detail: string;
	timestamp: string;
	type: "booking" | "care" | "payment";
};

type CustomerOverview = {
	stats: {
		activeBookings: number;
		pets: number;
		totalSpentThisMonth: number;
	};
	recentActivity: CustomerActivityEntry[];
};

const startOfMonth = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), 1);

export const customerRouter = createTRPCRouter({
	overview: protectedProcedure.query<CustomerOverview>(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const now = new Date();
		const monthStart = startOfMonth(now);

		const [
			activeBookings,
			petCount,
			monthlySpend,
			recentBookings,
			recentCareLogs,
		] = await ctx.db.$transaction([
			ctx.db.booking.count({
				where: {
					customerId: userId,
					endDate: { gte: now },
					status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
				},
			}),
			ctx.db.pet.count({
				where: { ownerId: userId },
			}),
			ctx.db.booking.aggregate({
				_sum: { price: true },
				where: {
					customerId: userId,
					startDate: { gte: monthStart, lte: now },
					status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_OUT] },
				},
			}),
			ctx.db.booking.findMany({
				where: { customerId: userId },
				orderBy: { createdAt: "desc" },
				take: 5,
				include: {
					pet: true,
				},
			}),
			ctx.db.careLog.findMany({
				where: { booking: { customerId: userId } },
				orderBy: { timestamp: "desc" },
				take: 5,
				include: {
					booking: {
						include: { pet: true },
					},
				},
			}),
		]);

		const monthlyRevenue = Number(monthlySpend._sum.price ?? 0);

		const activityEntries: CustomerActivityEntry[] = [];

		recentBookings.forEach((booking) => {
			activityEntries.push({
				id: `booking-${booking.id}`,
				title: `${booking.pet?.name ?? "Your pet"} booking ${booking.status.toLowerCase()}`,
				detail: `Check-in ${booking.startDate.toLocaleDateString()} • Check-out ${booking.endDate.toLocaleDateString()}`,
				timestamp: booking.createdAt.toISOString(),
				type: "booking",
			});
		});

		recentCareLogs.forEach((log) => {
			activityEntries.push({
				id: `care-${log.id}`,
				title: `${log.type} update for ${log.booking.pet?.name ?? "your pet"}`,
				detail: log.note,
				timestamp: log.timestamp.toISOString(),
				type: "care",
			});
		});

		activityEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

		return {
			stats: {
				activeBookings,
				pets: petCount,
				totalSpentThisMonth: Math.round(monthlyRevenue * 100) / 100,
			},
			recentActivity: activityEntries.slice(0, 6),
		};
	}),
});
