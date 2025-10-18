import { AuditAction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { CrudFactory } from "~/lib/crud/factory";
import {
	userEntityPolicy,
} from "~/lib/crud/entity-policies";
import {
	createUserSchema,
	updateUserSchema,
} from "~/lib/validations/users";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const userIdInput = z.object({ id: z.string().cuid() });

const createInput = createUserSchema;
const updateInput = z.object({
	id: z.string().cuid(),
	data: updateUserSchema,
});

const userAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"user",
		AuditAction.UPDATE,
		userEntityPolicy,
		[],
		undefined,
		undefined,
		userAuditActions,
	);

export const usersRouter = createTRPCRouter({
	list: createRoleProtectedProcedure(["OWNER", "ADMIN"])
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
					message: result.error ?? "Unable to list users",
				});
			}

			return result.data;
		}),

	getById: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(userIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "User not found",
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
					message: result.error ?? "Unable to create user",
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
					message: result.error ?? "Unable to update user",
				});
			}

			return result.data;
		}),

	delete: createRoleProtectedProcedure(["OWNER", "ADMIN"])
		.input(userIdInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to delete user",
				});
			}

			return { success: true };
		}),

	me: protectedProcedure.query(({ ctx }) => {
		return ctx.session.user;
	}),
});
