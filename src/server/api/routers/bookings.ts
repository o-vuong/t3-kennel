import { AuditAction, BookingStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { CrudFactory } from "~/lib/crud/factory";
import { bookingEntityPolicy } from "~/lib/crud/entity-policies";
import {
	createBookingSchema,
	updateBookingSchema,
} from "~/lib/validations/bookings";
import { parseUserRole } from "~/lib/auth/roles";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const bookingIdInput = z.object({ id: z.string().cuid() });

const bookingAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const updateInput = z.object({
	id: z.string().cuid(),
	data: updateBookingSchema,
	overrideToken: z.string().optional(),
});

const createInput = z.object({
	data: createBookingSchema,
	overrideToken: z.string().optional(),
});

const deleteInput = bookingIdInput.extend({
	overrideToken: z.string().optional(),
});

const myBookingsInput = z
	.object({
		status: z.nativeEnum(BookingStatus).optional(),
		includePast: z.boolean().optional(),
	})
	.optional();

const staffScheduleInput = z
	.object({
		date: z.coerce.date().optional(),
	})
	.optional();

const statusChangeInput = z.object({
	id: z.string().cuid(),
	overrideToken: z.string().optional(),
	note: z.string().min(3).max(500).optional(),
});

const CHECK_IN_ALLOWED_STATUSES: BookingStatus[] = [
	BookingStatus.PENDING,
	BookingStatus.CONFIRMED,
];

const CHECK_OUT_ALLOWED_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

const ACTIVE_STAFF_STATUSES: BookingStatus[] = [
	BookingStatus.PENDING,
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

const CANCEL_ELIGIBLE_STATUSES: BookingStatus[] = [
	BookingStatus.PENDING,
	BookingStatus.CONFIRMED,
];

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"booking",
		AuditAction.UPDATE,
		bookingEntityPolicy,
		[],
		undefined,
		undefined,
		bookingAuditActions,
	);

export const bookingsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(paginationInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.list(
				ctx.session,
				undefined,
				{ page: input.page, limit: input.limit },
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to list bookings",
				});
			}

			return result.data;
		}),

	getById: protectedProcedure
		.input(bookingIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "Booking not found",
				});
			}

			return result.data;
		}),

	create: protectedProcedure
		.input(createInput)
		.mutation(async ({ ctx, input }) => {
			const { overrideToken, data } = input;
			const factory = getFactory(ctx);

			const payload =
				parseUserRole((ctx.session.user as { role?: unknown })?.role) === "CUSTOMER"
					? {
							...data,
							customerId: ctx.session.user.id,
						}
					: data;

			const result = await factory.create(ctx.session, payload, overrideToken);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to create booking",
				});
			}

			return result.data;
		}),

	update: protectedProcedure
		.input(updateInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.update(
				ctx.session,
				input.id,
				input.data,
				input.overrideToken,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to update booking",
				});
			}

			return result.data;
		}),

	cancel: protectedProcedure
		.input(deleteInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(
				ctx.session,
				input.id,
				input.overrideToken,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to cancel booking",
				});
			}

			return { success: true };
		}),

	myBookings: protectedProcedure
		.input(myBookingsInput)
		.query(async ({ ctx, input }) => {
			const role = parseUserRole((ctx.session.user as { role?: unknown })?.role);
			const where: Record<string, unknown> = {};

			if (role === "CUSTOMER") {
				where.customerId = ctx.session.user.id;
			}

			if (input?.status) {
				where.status = input.status;
			}

			if (!input?.includePast) {
				where.endDate = { gte: new Date() };
			}

			const bookings = await ctx.db.booking.findMany({
				where,
				include: {
					pet: {
						select: {
							id: true,
							name: true,
							breed: true,
						},
					},
					kennel: {
						select: {
							id: true,
							name: true,
							size: true,
							price: true,
						},
					},
				},
				orderBy: { startDate: "desc" },
			});

			const now = Date.now();

			return bookings.map((booking: any) => ({
				id: booking.id as string,
				status: booking.status as BookingStatus,
				startDate: booking.startDate as Date,
				endDate: booking.endDate as Date,
				price: Number(booking.price),
				notes: booking.notes as string | null,
				isPast: (booking.endDate as Date).getTime() < now,
				canCancel: CANCEL_ELIGIBLE_STATUSES.includes(booking.status as BookingStatus),
				pet: booking.pet
					? {
							id: booking.pet.id as string,
							name: booking.pet.name as string | null,
							breed: booking.pet.breed as string | null,
						}
					: null,
				kennel: booking.kennel
					? {
							id: booking.kennel.id as string,
							name: booking.kennel.name as string,
							size: booking.kennel.size as string,
							price: Number(booking.kennel.price),
						}
					: null,
			}));
		}),

	staffSchedule: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(staffScheduleInput)
		.query(async ({ ctx, input }) => {
			const role = parseUserRole((ctx.session.user as { role?: unknown })?.role);
			const targetDate = input?.date ?? new Date();
			const rangeStart = startOfDay(targetDate);
			const rangeEnd = endOfDay(targetDate);

			const bookings = await ctx.db.booking.findMany({
				where: {
					status: { in: ACTIVE_STAFF_STATUSES },
					startDate: { lte: rangeEnd },
					endDate: { gte: rangeStart },
				},
				include: {
					pet: {
						select: { id: true, name: true, breed: true },
					},
					customer: {
						select: { id: true, name: true, email: true },
					},
					kennel: {
						select: { id: true, name: true, size: true, price: true },
					},
				},
				orderBy: { startDate: "asc" },
			});

			return {
				overrideRequired: role === "STAFF",
				bookings: bookings.map((booking: any) => ({
					id: booking.id as string,
					status: booking.status as BookingStatus,
					startDate: booking.startDate as Date,
					endDate: booking.endDate as Date,
					price: Number(booking.price),
					pet: booking.pet
						? {
								id: booking.pet.id as string,
								name: booking.pet.name as string | null,
								breed: booking.pet.breed as string | null,
							}
						: null,
					customer: booking.customer
						? {
								id: booking.customer.id as string,
								name:
									(booking.customer.name as string | null) ??
									(booking.customer.email as string | null),
								email: booking.customer.email as string | null,
							}
						: null,
					kennel: booking.kennel
						? {
								id: booking.kennel.id as string,
								name: booking.kennel.name as string,
								size: booking.kennel.size as string,
								price: Number(booking.kennel.price),
							}
						: null,
					canCheckIn: CHECK_IN_ALLOWED_STATUSES.includes(
						booking.status as BookingStatus,
					),
					canCheckOut: CHECK_OUT_ALLOWED_STATUSES.includes(
						booking.status as BookingStatus,
					),
				})),
			};
		}),

	checkIn: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(statusChangeInput)
		.mutation(async ({ ctx, input }) => {
			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
				select: { id: true, status: true, notes: true },
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Booking not found",
				});
			}

			if (!CHECK_IN_ALLOWED_STATUSES.includes(booking.status)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Booking cannot be checked in from its current status",
				});
			}

			const appendedNote = input.note
				? [booking.notes?.trim(), `[${new Date().toISOString()}] ${input.note}`]
						.filter(Boolean)
						.join("\n\n")
				: undefined;

			const factory = getFactory(ctx);
			const result = await factory.update(
				ctx.session,
				input.id,
				{
					status: BookingStatus.CHECKED_IN,
					...(appendedNote ? { notes: appendedNote } : {}),
				},
				input.overrideToken,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to check in booking",
				});
			}

			return result.data;
		}),

	checkOut: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(statusChangeInput)
		.mutation(async ({ ctx, input }) => {
			const booking = await ctx.db.booking.findUnique({
				where: { id: input.id },
				select: { id: true, status: true, notes: true },
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Booking not found",
				});
			}

			if (!CHECK_OUT_ALLOWED_STATUSES.includes(booking.status)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Booking cannot be checked out from its current status",
				});
			}

			const appendedNote = input.note
				? [booking.notes?.trim(), `[${new Date().toISOString()}] ${input.note}`]
						.filter(Boolean)
						.join("\n\n")
				: undefined;

			const factory = getFactory(ctx);
			const result = await factory.update(
				ctx.session,
				input.id,
				{
					status: BookingStatus.CHECKED_OUT,
					...(appendedNote ? { notes: appendedNote } : {}),
				},
				input.overrideToken,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to check out booking",
				});
			}

			return result.data;
		}),
});
