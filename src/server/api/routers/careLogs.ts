import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const careLogsRouter = createTRPCRouter({
	listByBooking: protectedProcedure
		.input(
			z.object({
				bookingId: z.string(),
			})
		)
		.query(({ ctx, input }) => {
			return ctx.db.careLog.findMany({
				where: { bookingId: input.bookingId },
				include: { booking: true, staff: true },
				orderBy: { timestamp: "desc" },
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				bookingId: z.string(),
				type: z.enum([
					"feeding",
					"medication",
					"exercise",
					"grooming",
					"medical",
				]),
				note: z.string(),
			})
		)
		.mutation(({ ctx, input }) => {
			return ctx.db.careLog.create({
				data: {
					bookingId: input.bookingId,
					type: input.type,
					note: input.note,
					staffId: ctx.session.user.id,
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				type: z
					.enum(["feeding", "medication", "exercise", "grooming", "medical"])
					.optional(),
				note: z.string().optional(),
			})
		)
		.mutation(({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.db.careLog.update({
				where: { id },
				data,
			});
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(({ ctx, input }) => {
			return ctx.db.careLog.delete({
				where: { id: input.id },
			});
		}),
});
