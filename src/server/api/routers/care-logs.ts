import { AuditAction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { careLogEntityPolicy } from "~/lib/crud/entity-policies";
import { CrudFactory } from "~/lib/crud/factory";
import {
	createCareLogSchema,
	updateCareLogSchema,
} from "~/lib/validations/care-logs";
import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const careLogIdInput = z.object({ id: z.string().cuid() });

const careLogAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"careLog",
		AuditAction.UPDATE,
		careLogEntityPolicy,
		["note"],
		undefined,
		undefined,
		careLogAuditActions
	);

export const careLogsRouter = createTRPCRouter({
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
					message: result.error ?? "Unable to list care logs",
				});
			}

			return result.data;
		}),

	getById: protectedProcedure
		.input(careLogIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "Care log not found",
				});
			}

			return result.data;
		}),

	create: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(createCareLogSchema)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const payload =
				ctx.session.user.role === "STAFF"
					? { ...input, staffId: ctx.session.user.id }
					: input;

			const result = await factory.create(ctx.session, payload);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to create care log",
				});
			}

			return result.data;
		}),

	update: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(z.object({ id: z.string().cuid(), data: updateCareLogSchema }))
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.update(ctx.session, input.id, input.data);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to update care log",
				});
			}

			return result.data;
		}),

	delete: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(careLogIdInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to delete care log",
				});
			}

			return { success: true };
		}),
});
