import { z } from "zod";
import { BookingStatus } from "@prisma/client";

const baseBookingSchema = z.object({
	petId: z.string().cuid(),
	kennelId: z.string().cuid(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	price: z.coerce.number().nonnegative(),
	status: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
	customerId: z.string().cuid().optional(),
	creatorId: z.string().cuid().optional(),
	notes: z.string().max(1000).optional(),
});

export const createBookingSchema = baseBookingSchema.superRefine((data, ctx) => {
	if (data.endDate <= data.startDate) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["endDate"],
			message: "End date must be after start date",
		});
	}
});

export const updateBookingSchema = baseBookingSchema
	.partial()
	.superRefine((data, ctx) => {
		if (data.startDate && data.endDate && data.endDate <= data.startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "End date must be after start date",
			});
		}
	});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
