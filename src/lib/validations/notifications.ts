import { z } from "zod";

export const createNotificationSchema = z.object({
	userId: z.string().cuid(),
	type: z.string().min(1).max(80),
	title: z.string().min(1).max(160),
	message: z.string().min(1).max(1000),
	payload: z.record(z.string(), z.unknown()).optional(),
	status: z.string().min(1).max(32).default("unread"),
});

export const updateNotificationSchema = createNotificationSchema.partial();

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
