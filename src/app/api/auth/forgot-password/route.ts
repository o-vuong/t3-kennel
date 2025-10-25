import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { sendEmail } from "~/lib/notifications/email";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = forgotPasswordSchema.parse(body);

		// Find user by email
		const user = await db.user.findUnique({
			where: { email },
		});

		// Always return success to prevent email enumeration
		// But only send email if user exists
		if (user) {
			// Generate reset token
			const resetToken = crypto.randomBytes(32).toString("hex");
			const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

			// Store reset token
			await db.verificationToken.create({
				data: {
					identifier: email,
					token: resetToken,
					expires: expiresAt,
					userId: user.id,
				},
			});

			// Send password reset email
			await sendEmail(user.id, "password-reset", {
				resetToken,
				userName: user.name || "User",
				resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
			});
		}

		return NextResponse.json({
			message: "If an account with that email exists, we've sent a password reset link.",
		});
	} catch (error) {
		console.error("Password reset request error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to process password reset request" },
			{ status: 500 }
		);
	}
}
