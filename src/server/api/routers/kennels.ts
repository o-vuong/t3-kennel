import { AuditAction, BookingStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { kennelEntityPolicy } from "~/lib/crud/entity-policies";
import { CrudFactory } from "~/lib/crud/factory";
import {
	createKennelSchema,
	kennelSizeSchema,
	updateKennelSchema,
} from "~/lib/validations/kennels";
import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const kennelIdInput = z.object({ id: z.string().cuid() });

const updateInput = z.object({
	id: z.string().cuid(),
	data: updateKennelSchema,
});

const createInput = createKennelSchema;

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
		kennelAuditActions
	);

const availabilityInput = z
	.object({
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		size: kennelSizeSchema.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.endDate <= data.startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "End date must be after start date",
			});
		}
	});

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
	BookingStatus.CONFIRMED,
	BookingStatus.CHECKED_IN,
];

export const kennelsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(paginationInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.list(ctx.session, undefined, {
				page: input.page,
				limit: input.limit,
			});

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
		.input(createInput)
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
		.input(updateInput)
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

	available: publicProcedure
		.input(availabilityInput)
		.query(async ({ ctx, input }) => {
			const overlapping = await ctx.db.booking.findMany({
				where: {
					status: { in: ACTIVE_BOOKING_STATUSES },
					startDate: { lt: input.endDate },
					endDate: { gt: input.startDate },
				},
				select: { kennelId: true },
			});

			const excludedIds = Array.from(
				new Set(
					overlapping
						.map((booking) => booking.kennelId)
						.filter((kennelId): kennelId is string => kennelId !== null)
				)
			);

			const kennels = await ctx.db.kennel.findMany({
				where: {
					isActive: true,
					...(input.size ? { size: input.size } : {}),
					...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
				},
				orderBy: { price: "asc" },
			});

			return kennels.map((kennel) => ({
				...kennel,
				price: Number(kennel.price),
			}));
		}),
});
