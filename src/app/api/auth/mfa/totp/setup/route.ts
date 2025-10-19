/**
 * TOTP Setup API Route
 * 
 * Handles TOTP enrollment for admin/owner users
 * Generates QR code and recovery codes for MFA setup
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "~/lib/auth/better-auth";
import { totpEnrollmentSchema } from "~/lib/auth/schemas";
import {
  generateTotpSecret,
  verifyTotpCode,
  enableTotpForUser,
  generateRecoveryCodes,
  encryptRecoveryCodes,
  encryptSecret,
} from "~/lib/auth/mfa";
import { withSystemRole } from "~/server/db-rls";

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/owner users can enroll in MFA
    if (!["ADMIN", "OWNER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "MFA enrollment is required for admin and owner roles only" },
        { status: 403 }
      );
    }

    // Check if TOTP is already enabled
    const user = await withSystemRole(async (tx) => {
      return tx.user.findUnique({
        where: { id: session.user.id },
        select: { totpEnabled: true, email: true, name: true },
      });
    });

    if (user?.totpEnabled) {
      return NextResponse.json(
        { error: "TOTP is already enabled for this user" },
        { status: 400 }
      );
    }

    // Generate TOTP secret and QR code
    const { secret, qrCodeUrl, manualEntryKey } = await generateTotpSecret(
      session.user.id,
      user?.email || session.user.email || ""
    );

    // Store the temporary secret in session/cache (in production, use Redis)
    // For now, we'll return it to be verified immediately
    return NextResponse.json({
      qrCodeUrl,
      manualEntryKey,
      tempSecret: secret, // In production, don't expose this - store in session
    });

  } catch (error) {
    console.error("TOTP setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup TOTP" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "OWNER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "MFA enrollment is required for admin and owner roles only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { totpCode, tempSecret } = body;

    // Validate TOTP code
    const validation = totpEnrollmentSchema.safeParse({ totpCode });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid TOTP code format" },
        { status: 400 }
      );
    }

    if (!tempSecret) {
      return NextResponse.json(
        { error: "Missing temporary secret" },
        { status: 400 }
      );
    }

    // Verify TOTP code
    const isValidCode = verifyTotpCode(tempSecret, totpCode);
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid TOTP code" },
        { status: 400 }
      );
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const encryptedRecoveryCodes = await encryptRecoveryCodes(recoveryCodes);

    // Encrypt and store TOTP secret
    const encryptedSecret = encryptSecret(tempSecret);

    // Enable TOTP for the user
    await enableTotpForUser(
      session.user.id,
      encryptedSecret,
      encryptedRecoveryCodes
    );

    return NextResponse.json({
      success: true,
      recoveryCodes, // Return these once for the user to save
      message: "TOTP enabled successfully"
    });

  } catch (error) {
    console.error("TOTP enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enable TOTP" },
      { status: 500 }
    );
  }
}