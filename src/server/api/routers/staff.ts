import { BookingStatus } from "@prisma/client";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";

type StaffScheduleEntry = {
	id: string;
	title: string;
	detail: string;
	dueAt: string;
	category: "care" | "check-in" | "check-out";
};

type StaffOverview = {
	metrics: {
		todaysCheckIns: {
			total: number;
			pending: number;
		};
		activePets: number;
		careLogsToday: number;
		checkOutsToday: {
			total: number;
			completed: number;
		};
	};
	schedule: StaffScheduleEntry[];
};

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const staffRouter = createTRPCRouter({
	overview: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"]).query<
		StaffOverview
	>(async ({ ctx }) => {
		const now = new Date();
		const dayStart = startOfDay(now);
		const dayEnd = endOfDay(now);

		const [
			checkInsTotal,
			checkInsPending,
			activePetsDistinct,
			careLogsToday,
			checkOutsTotal,
			checkOutsCompleted,
			upcomingCareLogs,
			upcomingCheckIns,
			upcomingCheckOuts,
		] = await ctx.db.$transaction([
			ctx.db.booking.count({
				where: {
					startDate: { gte: dayStart, lte: dayEnd },
				},
			}),
			ctx.db.booking.count({
				where: {
					startDate: { gte: dayStart, lte: dayEnd },
					status: BookingStatus.PENDING,
				},
			}),
			ctx.db.booking.findMany({
				where: {
					status: { in: ACTIVE_BOOKING_STATUSES },
					startDate: { lte: dayEnd },
					endDate: { gte: dayStart },
				},
				distinct: ["petId"],
				select: { petId: true },
			}),
			ctx.db.careLog.count({
				where: {
					timestamp: { gte: dayStart, lte: dayEnd },
				},
			}),
			ctx.db.booking.count({
				where: {
					endDate: { gte: dayStart, lte: dayEnd },
				},
			}),
			ctx.db.booking.count({
				where: {
					endDate: { gte: dayStart, lte: dayEnd },
					status: BookingStatus.CHECKED_OUT,
				},
			}),
			ctx.db.careLog.findMany({
				where: {
					timestamp: { gte: now, lte: dayEnd },
				},
				orderBy: { timestamp: "asc" },
				take: 5,
				include: {
					booking: {
						include: {
							pet: true,
						},
					},
				},
			}),
			ctx.db.booking.findMany({
				where: {
					startDate: { gte: now, lte: dayEnd },
				},
				orderBy: { startDate: "asc" },
				take: 5,
				include: {
					pet: true,
				},
			}),
			ctx.db.booking.findMany({
				where: {
					endDate: { gte: now, lte: dayEnd },
					status: { in: ACTIVE_BOOKING_STATUSES },
				},
				orderBy: { endDate: "asc" },
				take: 5,
				include: {
					pet: true,
				},
			}),
		]);

		const scheduleEntries: StaffScheduleEntry[] = [];

		upcomingCareLogs.forEach((log) => {
			const dueAt = log.timestamp.toISOString();
			scheduleEntries.push({
				id: `care-${log.id}`,
				title: `${log.type} - ${log.booking.pet?.name ?? "Unknown Pet"}`,
				detail: log.note,
				dueAt,
				category: "care",
			});
		});

		upcomingCheckIns.forEach((booking) => {
			const dueAt = booking.startDate.toISOString();
			scheduleEntries.push({
				id: `checkin-${booking.id}`,
				title: `Check-in - ${booking.pet?.name ?? "Guest"}`,
				detail: `Arrives at ${booking.startDate.toLocaleTimeString()}`,
				dueAt,
				category: "check-in",
			});
		});

		upcomingCheckOuts.forEach((booking) => {
			const dueAt = booking.endDate.toISOString();
			scheduleEntries.push({
				id: `checkout-${booking.id}`,
				title: `Check-out - ${booking.pet?.name ?? "Guest"}`,
				detail: `Pickup at ${booking.endDate.toLocaleTimeString()}`,
				dueAt,
				category: "check-out",
			});
		});

		scheduleEntries.sort((a, b) => a.dueAt.localeCompare(b.dueAt));

		return {
			metrics: {
				todaysCheckIns: {
					total: checkInsTotal,
					pending: checkInsPending,
				},
				activePets: activePetsDistinct.length,
				careLogsToday,
				checkOutsToday: {
					total: checkOutsTotal,
					completed: checkOutsCompleted,
				},
			},
			schedule: scheduleEntries.slice(0, 6),
		};
	}),
});
