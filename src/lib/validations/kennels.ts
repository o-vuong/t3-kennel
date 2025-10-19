import { z } from "zod";

const kennelSizes = ["small", "medium", "large", "xlarge"] as const;

export const createKennelSchema = z.object({
	name: z.string().min(1).max(120),
	size: z.enum(kennelSizes),
	description: z.string().max(500).optional(),
	price: z.coerce.number().nonnegative(),
	isActive: z.boolean().optional().default(true),
});

export const updateKennelSchema = createKennelSchema.partial();

export type CreateKennelInput = z.infer<typeof createKennelSchema>;
export type UpdateKennelInput = z.infer<typeof updateKennelSchema>;
