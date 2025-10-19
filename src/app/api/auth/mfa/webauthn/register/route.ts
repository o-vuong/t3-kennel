/**
 * WebAuthn Registration API Route
 * 
 * Handles passkey registration for MFA
 * Creates registration challenge and stores credentials
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import {
  webauthnRegistrationRequestSchema,
  webauthnRegistrationResponseSchema,
} from "~/lib/auth/schemas";
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
} from "~/lib/auth/mfa";
import { withSystemRole } from "~/server/db-rls";
import { env } from "~/env";

// Start registration process (GET)
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user requires MFA
    const user = await withSystemRole(async (tx) => {
      return tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          role: true,
          email: true,
          name: true,
          webauthnEnabled: true,
        },
      });
    });

    if (!["ADMIN", "OWNER"].includes(user?.role ?? "")) {
      return NextResponse.json(
        { error: "WebAuthn not required for this role" },
        { status: 403 }
      );
    }

    // Get existing credentials to exclude from registration
    const existingCredentials = await withSystemRole(async (tx) => {
      return tx.webAuthnCredential.findMany({
        where: { userId: session.user.id },
        select: { id: true },
      });
    });

    // Generate registration options
    const options = await generateWebAuthnRegistrationOptions(
      session.user.id,
      user?.name ?? session.user.name ?? "Unknown User",
      user?.email ?? session.user.email ?? ""
    );

    // Store challenge in session
    // In production, you might want to use Redis or database for this
    const challenge = options.challenge;
    
    return NextResponse.json({
      success: true,
      options: {
        ...options,
        // Convert ArrayBuffer to base64 for JSON serialization
        challenge: Buffer.from(options.challenge).toString('base64'),
        user: {
          ...options.user,
          id: Buffer.from(options.user.id).toString('base64'),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
          ...cred,
          id: Buffer.from(cred.id).toString('base64'),
        })),
      },
      challengeId: Buffer.from(challenge).toString('base64'),
    });

  } catch (error) {
    console.error("WebAuthn registration start error:", error);
    return NextResponse.json(
      { error: "Failed to start WebAuthn registration" },
      { status: 500 }
    );
  }
}

// Complete registration process (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = z.object({
      response: webauthnRegistrationResponseSchema,
      expectedChallenge: z.string(),
      credentialName: z.string().optional(),
    }).safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid registration data" },
        { status: 400 }
      );
    }

    const { response: credential, expectedChallenge, credentialName } = validation.data;

    // Verify the registration
    const verification = await verifyWebAuthnRegistration(
      session.user.id,
      credential as any,
      expectedChallenge,
      credentialName
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: "WebAuthn registration verification failed" },
        { status: 400 }
      );
    }

    console.info("WebAuthn credential registered successfully", {
      userId: session.user.id,
      credentialName: credentialName || "Passkey",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "WebAuthn credential registered successfully",
      credentialName: credentialName || "Passkey",
    });

  } catch (error) {
    console.error("WebAuthn registration complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete WebAuthn registration" },
      { status: 500 }
    );
  }
}