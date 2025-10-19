import { AuditAction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { notificationEntityPolicy } from "~/lib/crud/entity-policies";
import { CrudFactory } from "~/lib/crud/factory";
import {
	createNotificationSchema,
	updateNotificationSchema,
} from "~/lib/validations/notifications";
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

const notificationIdInput = z.object({ id: z.string().cuid() });

const notificationAuditActions = {
	create: AuditAction.CREATE,
	read: AuditAction.READ,
	update: AuditAction.UPDATE,
	delete: AuditAction.DELETE,
} as const;

const getFactory = (ctx: { db: any }) =>
	new CrudFactory(
		ctx.db,
		"notification",
		AuditAction.UPDATE,
		notificationEntityPolicy,
		[],
		undefined,
		undefined,
		notificationAuditActions,
	);

export const notificationsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(paginationInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.list(
				ctx.session,
				{
					filters: { userId: ctx.session.user.id },
				},
				{ page: input.page, limit: input.limit },
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to list notifications",
				});
			}

			return result.data;
		}),

	getById: protectedProcedure
		.input(notificationIdInput)
		.query(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.read(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: result.error ?? "Notification not found",
				});
			}

			return result.data;
		}),

	create: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF"])
		.input(createNotificationSchema)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.create(ctx.session, input);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to create notification",
				});
			}

			return result.data;
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string().cuid(), data: updateNotificationSchema }))
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.update(ctx.session, input.id, input.data);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to update notification",
				});
			}

			return result.data;
		}),

	delete: protectedProcedure
		.input(notificationIdInput)
		.mutation(async ({ ctx, input }) => {
			const factory = getFactory(ctx);
			const result = await factory.delete(ctx.session, input.id);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error ?? "Unable to delete notification",
				});
			}

			return { success: true };
		}),
	markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db.notification.updateMany({
			where: { userId: ctx.session.user.id, status: "unread" },
			data: { status: "read" },
		});

		return { success: true };
	}),
});
