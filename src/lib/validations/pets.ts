import { z } from "zod";

export const createPetSchema = z.object({
	name: z.string().min(1).max(80),
	breed: z.string().max(120).optional(),
	weight: z.number().positive().max(500).optional(),
	age: z.number().int().nonnegative().max(50).optional(),
	vaccinations: z.array(z.string()).optional().default([]),
	medicalNotes: z.string().max(1000).optional(),
	ownerId: z.string().cuid(),
});

export const updatePetSchema = createPetSchema.partial();

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
