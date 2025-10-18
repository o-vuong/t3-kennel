import { AuditAction } from "@prisma/client";
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

const createInput = createBookingSchema.extend({
	overrideToken: z.string().optional(),
});

const deleteInput = bookingIdInput.extend({
	overrideToken: z.string().optional(),
});

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
			const { overrideToken, ...data } = input;
			const factory = getFactory(ctx);

			const payload =
				ctx.session.user.role === "CUSTOMER"
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
});
