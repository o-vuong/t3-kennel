/**
 * MFA Guards and Enforcement
 * 
 * This module provides utilities to enforce MFA requirements on protected routes
 * and privileged actions based on user role and action sensitivity.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { getUserMfaStatus } from "~/lib/auth/mfa";

// Routes that require MFA for admin/owner users
const MFA_REQUIRED_ROUTES = [
  "/admin",
  "/owner", 
  "/api/overrides",
  "/api/auth/mfa",
] as const;

// High-security API routes that require fresh MFA (within 5 minutes)
const HIGH_SECURITY_ROUTES = [
  "/api/overrides/issue",
  "/api/admin/security",
  "/api/admin/users/roles",
  "/api/payments/refund",
] as const;

// Regular privileged routes that require MFA within 12 hours  
const PRIVILEGED_ROUTES = [
  "/api/admin",
  "/api/staff",
  "/api/owner",
  "/admin",
  "/owner",
] as const;

/**
 * Check if a route requires MFA enforcement
 */
export function requiresMfaEnforcement(pathname: string): boolean {
  return MFA_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route requires high-security MFA (fresh within 5 minutes)
 */
export function requiresHighSecurityMfa(pathname: string): boolean {
  return HIGH_SECURITY_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route requires privileged MFA (fresh within 12 hours)
 */
export function requiresPrivilegedMfa(pathname: string): boolean {
  return PRIVILEGED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * MFA Enforcement Response Helper
 */
export function createMfaRequiredResponse(
  request: NextRequest,
  reason: string,
  redirectTo?: string
): NextResponse {
  const { pathname } = request.nextUrl;
  
  // For API routes, return JSON error
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { 
        success: false, 
        error: "MFA required",
        code: "MFA_REQUIRED",
        message: reason,
        redirectTo: redirectTo || "/mfa/verify"
      },
      { status: 403 }
    );
  }
  
  // For page routes, redirect to MFA verification
  const mfaUrl = new URL(redirectTo || "/mfa/verify", request.url);
  mfaUrl.searchParams.set("redirect", pathname);
  mfaUrl.searchParams.set("reason", encodeURIComponent(reason));
  
  return NextResponse.redirect(mfaUrl);
}

/**
 * Middleware function to enforce MFA requirements
 * 
 * This should be called from Next.js middleware to check MFA requirements
 * before allowing access to protected routes.
 */
export async function enforceMfaMiddleware(
  request: NextRequest,
  session: any
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Skip MFA enforcement for non-protected routes
  if (!requiresMfaEnforcement(pathname)) {
    return null;
  }
  
  // Only enforce MFA for admin and owner roles
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return null;
  }

  try {
    // Get user's MFA status
    const mfaStatus = await getUserMfaStatus(session.user.id);
    
    // Check if user has any MFA method enabled
    if (!mfaStatus.totpEnabled && !mfaStatus.webauthnEnabled) {
      return createMfaRequiredResponse(
        request,
        "Multi-factor authentication must be enabled for your role",
        "/mfa/setup"
      );
    }

    // Check if MFA verification is fresh enough for the requested action
    let actionType = "regular";
    
    if (requiresHighSecurityMfa(pathname)) {
      actionType = "issue_override_token"; // High security action
    } else if (requiresPrivilegedMfa(pathname)) {
      actionType = "access_dashboard"; // Regular privileged action
    }

    if (mfaStatus.requiresFreshMfa(actionType)) {
      const timeRequirement = actionType === "issue_override_token" 
        ? "within the last 5 minutes"
        : "within the last 12 hours";
        
      return createMfaRequiredResponse(
        request,
        `This action requires MFA verification ${timeRequirement}`,
        "/mfa/verify"
      );
    }

    // MFA requirements satisfied
    return null;
    
  } catch (error) {
    console.error("MFA enforcement error:", error);
    
    // On error, be conservative and require MFA verification
    return createMfaRequiredResponse(
      request,
      "Unable to verify MFA status. Please verify your identity.",
      "/mfa/verify"
    );
  }
}

/**
 * API Route MFA Guard
 * 
 * Use this in API routes to enforce MFA requirements programmatically.
 */
export async function requireMfaForAction(
  userId: string,
  userRole: string,
  action: string
): Promise<{ success: true } | { success: false; error: string; code: string }> {
  // Only enforce MFA for admin and owner roles
  if (!["ADMIN", "OWNER"].includes(userRole)) {
    return { success: true };
  }

  try {
    const mfaStatus = await getUserMfaStatus(userId);
    
    // Check if user has any MFA method enabled
    if (!mfaStatus.totpEnabled && !mfaStatus.webauthnEnabled) {
      return {
        success: false,
        error: "Multi-factor authentication must be enabled for your role",
        code: "MFA_NOT_ENROLLED"
      };
    }

    // Check if MFA verification is fresh enough for the action
    if (mfaStatus.requiresFreshMfa(action)) {
      const isHighSecurity = [
        "issue_override_token",
        "access_security_settings", 
        "modify_user_roles",
        "process_refund"
      ].includes(action);
      
      const timeRequirement = isHighSecurity 
        ? "within the last 5 minutes"
        : "within the last 12 hours";
        
      return {
        success: false,
        error: `This action requires MFA verification ${timeRequirement}`,
        code: "MFA_VERIFICATION_STALE"
      };
    }

    return { success: true };
    
  } catch (error) {
    console.error("MFA requirement check error:", error);
    return {
      success: false,
      error: "Unable to verify MFA status",
      code: "MFA_CHECK_ERROR"
    };
  }
}

/**
 * Step-up MFA Challenge Helper
 * 
 * Generate a response that prompts for step-up authentication
 */
export function createStepUpMfaChallenge(action: string): NextResponse {
  return NextResponse.json({
    success: false,
    error: "Step-up authentication required",
    code: "STEP_UP_MFA_REQUIRED", 
    challenge: {
      action,
      timestamp: new Date().toISOString(),
      methods: ["totp", "webauthn", "recovery"],
    }
  }, { status: 403 });
}