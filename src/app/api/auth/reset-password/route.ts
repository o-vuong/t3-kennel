import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { hashPassword } from "better-auth/adapters";
import crypto from "crypto";

const resetPasswordSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { token, password } = resetPasswordSchema.parse(body);

		// Find the reset token
		const resetToken = await db.verificationToken.findUnique({
			where: { token },
			include: { user: true },
		});

		if (!resetToken) {
			return NextResponse.json(
				{ error: "Invalid or expired reset token" },
				{ status: 400 }
			);
		}

		// Check if token is expired
		if (resetToken.expires < new Date()) {
			// Clean up expired token
			await db.verificationToken.delete({
				where: { id: resetToken.id },
			});

			return NextResponse.json(
				{ error: "Reset token has expired" },
				{ status: 400 }
			);
		}

		// Hash the new password
		const hashedPassword = await hashPassword(password);

		// Update user password
		await db.user.update({
			where: { id: resetToken.userId },
			data: { 
				emailVerified: true, // Also verify email if not already
			},
		});

		// Update the account password
		await db.account.updateMany({
			where: {
				userId: resetToken.userId,
				provider: "credential",
			},
			data: {
				password: hashedPassword,
			},
		});

		// Clean up the reset token
		await db.verificationToken.delete({
			where: { id: resetToken.id },
		});

		// Invalidate all existing sessions for security
		await db.session.deleteMany({
			where: { userId: resetToken.userId },
		});

		return NextResponse.json({
			message: "Password reset successfully. Please sign in with your new password.",
		});
	} catch (error) {
		console.error("Password reset error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to reset password" },
			{ status: 500 }
		);
	}
}
