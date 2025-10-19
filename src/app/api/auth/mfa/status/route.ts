/**
 * MFA Status API
 * 
 * GET /api/auth/mfa/status
 * Returns the user's current MFA enrollment and verification status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { getUserMfaStatus } from "~/lib/auth/mfa";

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

    // Get MFA status
    const mfaStatus = await getUserMfaStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        totpEnabled: mfaStatus.totpEnabled,
        webauthnEnabled: mfaStatus.webauthnEnabled,
        webauthnCredentials: mfaStatus.webauthnCredentials,
        recoveryCodesRemaining: mfaStatus.recoveryCodesRemaining,
        mfaVerifiedAt: mfaStatus.mfaVerifiedAt,
        requiresMfaForActions: {
          highSecurity: mfaStatus.requiresFreshMfa("issue_override_token"),
          regular: mfaStatus.requiresFreshMfa("access_dashboard"),
        },
      },
    });

  } catch (error) {
    console.error("MFA status check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}