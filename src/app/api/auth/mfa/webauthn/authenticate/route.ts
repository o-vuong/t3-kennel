import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { 
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication 
} from "~/lib/auth/mfa";
import { webauthnAuthenticationResponseSchema } from "~/lib/auth/schemas";
import { env } from "~/env";

// GET: Generate authentication options
export async function GET(request: NextRequest) {
	try {
		// Get session
		const session = await auth.api.getSession({ headers: request.headers });
		
		if (!session?.user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Generate WebAuthn authentication options
		const options = await generateWebAuthnAuthenticationOptions(session.user.id);
		
		return NextResponse.json({
			success: true,
			options,
		});
	} catch (error) {
		console.error("WebAuthn authentication options generation failed:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to generate authentication options" },
			{ status: 500 }
		);
	}
}

// POST: Verify authentication response
export async function POST(request: NextRequest) {
	try {
		// Get session
		const session = await auth.api.getSession({ headers: request.headers });
		
		if (!session?.user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validation = z.object({
			response: webauthnAuthenticationResponseSchema,
			expectedChallenge: z.string(),
		}).safeParse(body);
		
		if (!validation.success) {
			return NextResponse.json(
				{ 
					success: false, 
					error: "Invalid input",
					details: validation.error.issues 
				},
				{ status: 400 }
			);
		}

		const { response: authResponse, expectedChallenge } = validation.data;

		// Verify WebAuthn authentication
		const result = await verifyWebAuthnAuthentication(
			authResponse as any,
			expectedChallenge,
			session.user.id
		);

		if (!result.verified) {
			console.warn(`Failed WebAuthn authentication for user ${session.user.id}`);
			return NextResponse.json(
				{ success: false, error: "Authentication failed" },
				{ status: 400 }
			);
		}

		console.info(`Successful WebAuthn authentication for user ${session.user.id}`);

		return NextResponse.json({
			success: true,
			message: "WebAuthn authentication successful. MFA verification updated.",
		});
	} catch (error) {
		console.error("WebAuthn authentication error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
