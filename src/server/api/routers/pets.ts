import { AuditAction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { CrudFactory } from "~/lib/crud/factory";
import { petEntityPolicy } from "~/lib/crud/entity-policies";
import {
	createPetSchema,
	updatePetSchema,
} from "~/lib/validations/pets";

const paginationInput = z
	.object({
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(20),
	})
	.default({ page: 1, limit: 20 });

const petIdInput = z.object({ id: z.string().cuid() });

const petAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"pet",
		AuditAction.UPDATE,
		petEntityPolicy,
		[],
		undefined,
		undefined,
		petAuditActions,
	);

export const petsRouter = createTRPCRouter({
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
					message: result.error ?? "Unable to list pets",
				});
			}

			return result.data;
		}),

	getById: protectedProcedure
		.input(petIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "Pet not found",
				});
			}

			return result.data;
		}),

	create: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(createPetSchema)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const payload = ctx.session.user.role === "CUSTOMER"
				? { ...input, ownerId: ctx.session.user.id }
				: input;

			const result = await factory.create(ctx.session, payload);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to create pet",
				});
			}

			return result.data;
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string().cuid(), data: updatePetSchema }))
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.update(ctx.session, input.id, input.data);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to update pet",
				});
			}

			return result.data;
		}),

	delete: protectedProcedure
		.input(petIdInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to delete pet",
				});
			}

			return { success: true };
		}),
});
