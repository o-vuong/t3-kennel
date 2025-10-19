/**
 * TOTP Verification API Route
 * 
 * Handles TOTP verification for step-up authentication
 * Updates user's MFA verification timestamp on success
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "~/lib/auth/better-auth";
import { totpVerificationSchema } from "~/lib/auth/schemas";
import {
  verifyTotpCode,
  decryptSecret,
} from "~/lib/auth/mfa";
import { withSystemRole } from "~/server/db-rls";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { totpCode, action } = body;

    // Validate TOTP code format
    const validation = totpVerificationSchema.safeParse({ totpCode });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid TOTP code format" },
        { status: 400 }
      );
    }

    // Get user's TOTP secret
    const user = await withSystemRole(async (tx) => {
      return tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          totpSecret: true,
          totpEnabled: true,
          role: true,
        },
      });
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      return NextResponse.json(
        { error: "TOTP is not enabled for this user" },
        { status: 400 }
      );
    }

    // Only admin/owner require MFA for privileged actions
    if (!["ADMIN", "OWNER"].includes(user.role)) {
      return NextResponse.json(
        { error: "MFA verification not required for this role" },
        { status: 403 }
      );
    }

    // Decrypt TOTP secret
    let decryptedSecret: string;
    try {
      decryptedSecret = decryptSecret(user.totpSecret);
    } catch (error) {
      console.error("Failed to decrypt TOTP secret:", error);
      return NextResponse.json(
        { error: "Failed to verify TOTP code" },
        { status: 500 }
      );
    }

    // Verify TOTP code
    const isValidCode = verifyTotpCode(decryptedSecret, totpCode);
    if (!isValidCode) {
      // Log MFA failure for security monitoring
      console.warn("MFA verification failed", {
        userId: session.user.id,
        action,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: "Invalid TOTP code" },
        { status: 400 }
      );
    }

    // Update MFA verification timestamp
    await withSystemRole(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { mfaVerifiedAt: new Date() },
      });
    });

    // Log successful MFA verification
    console.info("MFA verification successful", {
      userId: session.user.id,
      action,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "TOTP verified successfully",
      mfaVerifiedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("TOTP verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify TOTP code" },
      { status: 500 }
    );
  }
}