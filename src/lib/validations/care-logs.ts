import { z } from "zod";

export const createCareLogSchema = z.object({
	bookingId: z.string().cuid(),
	type: z.string().min(1).max(80),
	note: z.string().min(1).max(1000),
	timestamp: z.coerce
		.date()
		.optional()
		.default(() => new Date()),
	staffId: z.string().cuid(),
});

export const updateCareLogSchema = createCareLogSchema.partial();

export type CreateCareLogInput = z.infer<typeof createCareLogSchema>;
export type UpdateCareLogInput = z.infer<typeof updateCareLogSchema>;
