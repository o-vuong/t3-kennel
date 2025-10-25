import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { db } from "~/server/db";

const verifyEmailSchema = z.object({
	token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { token } = verifyEmailSchema.parse(body);

		// Find the verification token
		const verificationToken = await db.verificationToken.findUnique({
			where: { token },
			include: { user: true },
		});

		if (!verificationToken) {
			return NextResponse.json(
				{ error: "Invalid or expired verification token" },
				{ status: 400 }
			);
		}

		// Check if token is expired
		if (verificationToken.expires < new Date()) {
			// Clean up expired token
			await db.verificationToken.delete({
				where: { id: verificationToken.id },
			});

			return NextResponse.json(
				{ error: "Verification token has expired" },
				{ status: 400 }
			);
		}

		// Update user email verification status
		await db.user.update({
			where: { id: verificationToken.userId },
			data: { emailVerified: true },
		});

		// Clean up the verification token
		await db.verificationToken.delete({
			where: { id: verificationToken.id },
		});

		return NextResponse.json({
			message: "Email verified successfully",
			user: {
				id: verificationToken.user.id,
				email: verificationToken.user.email,
				emailVerified: true,
			},
		});
	} catch (error) {
		console.error("Email verification error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to verify email" },
			{ status: 500 }
		);
	}
}
