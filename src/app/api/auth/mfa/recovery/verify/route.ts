/**
 * MFA Recovery Code Verification API
 * 
 * POST /api/auth/mfa/recovery/verify
 * Verifies a recovery code for MFA bypass
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth/better-auth";
import { verifyRecoveryCode } from "~/lib/auth/mfa";
import { recoveryCodeVerificationSchema } from "~/lib/auth/schemas";

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
    const validation = recoveryCodeVerificationSchema.safeParse(body);
    
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

    const { recoveryCode } = validation.data;

    // Verify recovery code
    const isValid = await verifyRecoveryCode(session.user.id, recoveryCode);

    if (!isValid) {
      console.warn(`Failed recovery code verification for user ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: "Invalid recovery code" },
        { status: 400 }
      );
    }

    console.info(`Successful recovery code verification for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Recovery code verified successfully. MFA verification updated.",
    });

  } catch (error) {
    console.error("Recovery code verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}