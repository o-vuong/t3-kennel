import { AuditAction, BookingStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { CrudFactory } from "~/lib/crud/factory";
import { kennelEntityPolicy } from "~/lib/crud/entity-policies";
import {
	createKennelSchema,
	updateKennelSchema,
} from "~/lib/validations/kennels";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const kennelIdInput = z.object({ id: z.string().cuid() });

const kennelAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"kennel",
		AuditAction.UPDATE,
		kennelEntityPolicy,
		[],
		undefined,
		undefined,
		kennelAuditActions,
	);

const availableInput = z.object({
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	size: z.string().optional(),
});

export const kennelsRouter = createTRPCRouter({
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
					message: result.error ?? "Unable to list kennels",
				});
			}

			return result.data;
		}),

	getById: protectedProcedure
		.input(kennelIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "Kennel not found",
				});
			}

			return result.data;
		}),

	create: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(createKennelSchema)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.create(ctx.session, input);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to create kennel",
				});
			}

			return result.data;
		}),

	update: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(z.object({ id: z.string().cuid(), data: updateKennelSchema }))
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.update(ctx.session, input.id, input.data);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to update kennel",
				});
			}

			return result.data;
		}),

	delete: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(kennelIdInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to delete kennel",
				});
			}

			return { success: true };
		}),

	available: protectedProcedure
		.input(availableInput)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate, size } = input;

			// Find kennels with overlapping bookings that are confirmed or checked in
			const bookedKennelIds = await ctx.db.booking.findMany({
				where: {
					status: {
						in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
					},
					OR: [
						{
							startDate: { lte: endDate },
							endDate: { gte: startDate },
						},
					],
				},
				select: {
					kennelId: true,
				},
			});

			const excludedKennelIds = bookedKennelIds.map((b) => b.kennelId);

			// Find available kennels
			const where: any = {
				isActive: true,
				id: {
					notIn: excludedKennelIds,
				},
			};

			if (size) {
				where.size = size;
			}

			const availableKennels = await ctx.db.kennel.findMany({
				where,
				orderBy: {
					price: "asc",
				},
			});

			return availableKennels;
		}),
});
