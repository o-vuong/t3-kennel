import { z } from "zod";

import {
	createRoleProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

const roleSchema = z.enum(["OWNER", "ADMIN", "STAFF", "CUSTOMER"]).catch("CUSTOMER");

export const systemRouter = createTRPCRouter({
	ping: publicProcedure.query(() => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	})),
	session: protectedProcedure.query(({ ctx }) => ({
		user: {
			id: ctx.session.user.id,
			email: ctx.session.user.email,
			name: ctx.session.user.name,
			role: roleSchema.parse((ctx.session.user as { role?: unknown })?.role),
		},
	})),
	roleCheck: createRoleProtectedProcedure(["OWNER", "ADMIN", "STAFF", "CUSTOMER"]).query(({ ctx }) => ({
		role: roleSchema.parse((ctx.session.user as { role?: unknown })?.role),
		userId: ctx.session.user.id,
	})),
});
