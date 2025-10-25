import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

const validateTokenSchema = z.object({
	token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { token } = validateTokenSchema.parse(body);

		// Find the reset token
		const resetToken = await db.verificationToken.findUnique({
			where: { token },
		});

		if (!resetToken) {
			return NextResponse.json(
				{ error: "Invalid reset token" },
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

		return NextResponse.json({
			valid: true,
			message: "Token is valid",
		});
	} catch (error) {
		console.error("Token validation error:", error);
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to validate token" },
			{ status: 500 }
		);
	}
}
