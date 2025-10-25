import { UserRole } from "@prisma/client";
import { z } from "zod";

export const baseUserSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1).max(120).optional(),
	role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
	phone: z.string().min(5).max(32).optional(),
	address: z.string().max(255).optional(),
	profile: z.record(z.string(), z.unknown()).optional(),
});

export const createUserSchema = baseUserSchema;

export const updateUserSchema = baseUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
