import { BookingStatus } from "@prisma/client";
import { z } from "zod";

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

export const createBookingSchema = baseBookingSchema.superRefine(
	(data, ctx) => {
		if (data.endDate <= data.startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "End date must be after start date",
			});
		}

		// Validate booking duration (minimum 1 day, maximum 30 days)
		const durationMs = data.endDate.getTime() - data.startDate.getTime();
		const durationDays = durationMs / (1000 * 60 * 60 * 24);

		if (durationDays < 1) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "Booking must be at least 1 day long",
			});
		}

		if (durationDays > 30) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "Booking cannot exceed 30 days",
			});
		}

		// Validate booking is not in the past
		const now = new Date();
		if (data.startDate < now) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["startDate"],
				message: "Booking cannot start in the past",
			});
		}
	}
);

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
