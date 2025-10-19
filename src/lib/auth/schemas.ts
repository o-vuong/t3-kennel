/**
 * Authentication schemas for MFA flows
 * 
 * This file contains Zod schemas for TOTP and WebAuthn authentication,
 * including enrollment, verification, and recovery code management.
 */

import { z } from "zod";

// TOTP (Time-based One-Time Password) Schemas
export const totpEnrollmentSchema = z.object({
  totpCode: z.string()
    .min(6, "TOTP code must be 6 digits")
    .max(6, "TOTP code must be 6 digits")
    .regex(/^\d{6}$/, "TOTP code must contain only numbers"),
});

export const totpVerificationSchema = z.object({
  totpCode: z.string()
    .min(6, "TOTP code must be 6 digits")  
    .max(6, "TOTP code must be 6 digits")
    .regex(/^\d{6}$/, "TOTP code must contain only numbers"),
});

export const totpSetupResponseSchema = z.object({
  qrCodeUrl: z.string(),
  manualEntryKey: z.string(),
  recoveryCodes: z.array(z.string()),
});

// WebAuthn (Passkey) Schemas
export const webauthnRegistrationRequestSchema = z.object({
  name: z.string()
    .min(1, "Credential name is required")
    .max(50, "Credential name must be less than 50 characters"),
});

export const webauthnRegistrationResponseSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
  }),
  type: z.literal("public-key"),
  clientExtensionResults: z.record(z.unknown()).optional(),
  authenticatorAttachment: z.enum(["platform", "cross-platform"]).optional(),
});

export const webauthnAuthenticationResponseSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  type: z.literal("public-key"),
  clientExtensionResults: z.record(z.unknown()).optional(),
  authenticatorAttachment: z.enum(["platform", "cross-platform"]).optional(),
});

// Recovery Code Schemas
export const recoveryCodeSchema = z.object({
  recoveryCode: z.string()
    .min(8, "Recovery code must be at least 8 characters")
    .max(16, "Recovery code must be less than 16 characters")
    .regex(/^[A-Z0-9-]+$/, "Recovery code format is invalid"),
});

export const recoveryCodeVerificationSchema = recoveryCodeSchema;

export const regenerateRecoveryCodesSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
});

// MFA Challenge Schemas
export const mfaChallengeSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("totp"),
    totpCode: z.string()
      .min(6, "TOTP code must be 6 digits")
      .max(6, "TOTP code must be 6 digits")
      .regex(/^\d{6}$/, "TOTP code must contain only numbers"),
  }),
  z.object({
    method: z.literal("webauthn"),
    webauthnResponse: webauthnAuthenticationResponseSchema,
  }),
  z.object({
    method: z.literal("recovery"),
    recoveryCode: z.string()
      .min(8, "Recovery code must be at least 8 characters")
      .max(16, "Recovery code must be less than 16 characters")
      .regex(/^[A-Z0-9-]+$/, "Recovery code format is invalid"),
  }),
]);

// MFA Status Schema
export const mfaStatusSchema = z.object({
  totpEnabled: z.boolean(),
  webauthnEnabled: z.boolean(),
  webauthnCredentials: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    deviceType: z.string(),
    createdAt: z.date(),
    lastUsedAt: z.date().optional(),
  })),
  recoveryCodesRemaining: z.number(),
  mfaVerifiedAt: z.date().optional(),
  requiresFreshMfa: z.boolean(),
});

// Step-up Authentication Schemas
export const stepUpAuthSchema = z.object({
  action: z.enum([
    "issue_override_token",
    "access_security_settings", 
    "process_refund",
    "modify_user_roles",
    "access_audit_logs",
    "export_data",
  ]),
  mfaMethod: z.enum(["totp", "webauthn", "recovery"]),
  mfaChallenge: mfaChallengeSchema,
});

// Password Requirements Schema
export const passwordRequirementsSchema = z.object({
  minLength: z.number().default(12),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
  disallowCommonPasswords: z.boolean().default(true),
});

export const strongPasswordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter") 
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .refine((password) => {
    // Basic check against common passwords
    const commonPasswords = [
      "password", "123456", "password123", "admin", "qwerty", 
      "letmein", "welcome", "monkey", "dragon", "password1"
    ];
    return !commonPasswords.includes(password.toLowerCase());
  }, "Password is too common");

// Type exports for use throughout the application
export type TotpEnrollment = z.infer<typeof totpEnrollmentSchema>;
export type TotpVerification = z.infer<typeof totpVerificationSchema>;
export type TotpSetupResponse = z.infer<typeof totpSetupResponseSchema>;
export type WebAuthnRegistrationRequest = z.infer<typeof webauthnRegistrationRequestSchema>;
export type WebAuthnRegistrationResponse = z.infer<typeof webauthnRegistrationResponseSchema>;
export type WebAuthnAuthenticationResponse = z.infer<typeof webauthnAuthenticationResponseSchema>;
export type RecoveryCode = z.infer<typeof recoveryCodeSchema>;
export type MfaChallenge = z.infer<typeof mfaChallengeSchema>;
export type MfaStatus = z.infer<typeof mfaStatusSchema>;
export type StepUpAuth = z.infer<typeof stepUpAuthSchema>;
export type PasswordRequirements = z.infer<typeof passwordRequirementsSchema>;