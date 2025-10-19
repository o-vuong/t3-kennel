import { z } from "zod";

export const createCareLogSchema = z.object({
	bookingId: z.string().cuid(),
	type: z.enum([
		"FEEDING",
		"EXERCISE", 
		"MEDICATION",
		"GROOMING",
		"HEALTH_CHECK",
		"PLAY_TIME",
		"POTTY_BREAK",
		"OTHER"
	]),
	note: z.string().min(1).max(1000),
	timestamp: z.coerce
		.date()
		.optional()
		.default(() => new Date()),
	staffId: z.string().cuid(),
	photos: z.array(z.string().url()).optional(),
	healthStatus: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "CONCERNING"]).optional(),
	medicationGiven: z.string().max(200).optional(),
	nextActivity: z.string().max(200).optional(),
});

export const updateCareLogSchema = createCareLogSchema.partial();

export type CreateCareLogInput = z.infer<typeof createCareLogSchema>;
export type UpdateCareLogInput = z.infer<typeof updateCareLogSchema>;
