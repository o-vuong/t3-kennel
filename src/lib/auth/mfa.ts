/**
 * Multi-Factor Authentication (MFA) utilities
 * 
 * This module provides TOTP and WebAuthn functionality for secure authentication
 * including enrollment, verification, and recovery code management.
 */

import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { withSystemRole } from "~/server/db-rls";

// TOTP Configuration
const TOTP_CONFIG = {
  name: "Kennel Management System",
  issuer: "KMS",
  window: 2, // Allow 2 time steps (60 seconds) of drift
  encoding: "base32" as const,
};

// WebAuthn Configuration
const WEBAUTHN_CONFIG = {
  rpName: "Kennel Management System",
  rpID: process.env.WEBAUTHN_RP_ID || "localhost",
  origin: process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
  timeout: 60000, // 60 seconds
};

// Recovery Code Configuration
const RECOVERY_CODE_CONFIG = {
  length: 10, // Generate 10 recovery codes
  codeLength: 12, // Each code is 12 characters
};

/**
 * TOTP (Time-based One-Time Password) Functions
 */

/**
 * Generate TOTP secret and QR code for enrollment
 */
export async function generateTotpSecret(userId: string, userEmail: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}> {
  const secret = speakeasy.generateSecret({
    name: `${TOTP_CONFIG.issuer}:${userEmail}`,
    issuer: TOTP_CONFIG.issuer,
    length: 32,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32!,
    qrCodeUrl,
    manualEntryKey: secret.base32!,
  };
}

/**
 * Verify TOTP code during enrollment or authentication
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: TOTP_CONFIG.encoding,
    token,
    window: TOTP_CONFIG.window,
  });
}

/**
 * Enable TOTP for a user after successful verification
 */
export async function enableTotpForUser(
  userId: string, 
  encryptedSecret: string,
  recoveryCodes: string[]
): Promise<void> {
  await withSystemRole(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: true,
        mfaRecoveryCodes: recoveryCodes,
        mfaVerifiedAt: new Date(),
      },
    });
  });
}

/**
 * WebAuthn (Passkey) Functions
 */

/**
 * Generate WebAuthn registration options
 */
export async function generateWebAuthnRegistrationOptions(
  userId: string,
  userName: string,
  userEmail: string
): Promise<any> {
  // Get existing credentials to exclude them
  const existingCredentials = await withSystemRole(async (tx) => {
    return tx.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true },
    });
  });

  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_CONFIG.rpName,
    rpID: WEBAUTHN_CONFIG.rpID,
    userID: new TextEncoder().encode(userId),
    userName: userEmail,
    userDisplayName: userName,
    timeout: WEBAUTHN_CONFIG.timeout,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialId,
      type: "public-key" as const,
      transports: ["internal", "usb", "nfc", "ble"],
    })),
    authenticatorSelection: {
      residentKey: "discouraged",
      userVerification: "preferred",
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
  });

  return options;
}

/**
 * Verify WebAuthn registration response
 */
export async function verifyWebAuthnRegistration(
  userId: string,
  registrationResponse: any,
  expectedChallenge: string,
  credentialName?: string
): Promise<{ verified: boolean; credentialId?: string }> {
  try {
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.origin,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const registrationInfo = verification.registrationInfo;
      const credentialID = registrationInfo.credential.id;
      const credentialPublicKey = registrationInfo.credential.publicKey;
      const counter = registrationInfo.credential.counter;
      
      // Store the credential in the database
      await withSystemRole(async (tx) => {
        await tx.webAuthnCredential.create({
          data: {
            userId,
            credentialId: credentialID,
            publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
            counter,
            deviceType: registrationResponse.response.getTransports?.()[0] || "unknown",
            name: credentialName || "Security Key",
            transports: registrationResponse.response.getTransports?.() || [],
          },
        });

        // Enable WebAuthn for the user
        await tx.user.update({
          where: { id: userId },
          data: {
            webauthnEnabled: true,
            mfaVerifiedAt: new Date(),
          },
        });
      });

      return {
        verified: true,
        credentialId: credentialID,
      };
    }

    return { verified: false };
  } catch (error) {
    console.error("WebAuthn registration verification failed:", error);
    return { verified: false };
  }
}

/**
 * Generate WebAuthn authentication options
 */
export async function generateWebAuthnAuthenticationOptions(
  userId?: string
): Promise<any> {
  let allowCredentials: any[] = [];

  if (userId) {
    const userCredentials = await withSystemRole(async (tx) => {
      return tx.webAuthnCredential.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      });
    });

    allowCredentials = userCredentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, "base64url"),
      type: "public-key",
      transports: cred.transports as any,
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID: WEBAUTHN_CONFIG.rpID,
    timeout: WEBAUTHN_CONFIG.timeout,
    allowCredentials,
    userVerification: "preferred",
  });

  return options;
}

/**
 * Verify WebAuthn authentication response
 */
export async function verifyWebAuthnAuthentication(
  authenticationResponse: any,
  expectedChallenge: string,
  userId?: string
): Promise<{ verified: boolean; userId?: string }> {
  try {
    const credentialId = authenticationResponse.id;
    
    // Find the credential in the database
    const credential = await withSystemRole(async (tx) => {
      return tx.webAuthnCredential.findFirst({
        where: { 
          credentialId: credentialId,
          ...(userId ? { userId } : {}),
        },
        include: { user: true },
      });
    });

    if (!credential) {
      return { verified: false };
    }

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.origin,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
      credential: {
        id: credential.credentialId,
        publicKey: Buffer.from(credential.publicKey, "base64url"),
        counter: credential.counter,
        transports: (credential.transports || []) as any[],
      },
    });

    if (verification.verified) {
      // Update counter and last used timestamp
      await withSystemRole(async (tx) => {
        await tx.webAuthnCredential.update({
          where: { id: credential.id },
          data: {
            counter: verification.authenticationInfo?.newCounter || credential.counter,
            lastUsedAt: new Date(),
          },
        });

        // Update user's MFA verification timestamp
        await tx.user.update({
          where: { id: credential.userId },
          data: { mfaVerifiedAt: new Date() },
        });
      });

      return {
        verified: true,
        userId: credential.userId,
      };
    }

    return { verified: false };
  } catch (error) {
    console.error("WebAuthn authentication verification failed:", error);
    return { verified: false };
  }
}

/**
 * Recovery Code Functions
 */

/**
 * Generate recovery codes for MFA backup
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < RECOVERY_CODE_CONFIG.length; i++) {
    // Generate a random code with format XXXX-XXXX-XXXX
    const code = crypto.randomBytes(6)
      .toString("hex")
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join("-");
    codes.push(code);
  }
  
  return codes;
}

/**
 * Encrypt recovery codes for storage
 */
export async function encryptRecoveryCodes(codes: string[]): Promise<string[]> {
  const encryptedCodes: string[] = [];
  
  for (const code of codes) {
    const hash = await bcrypt.hash(code, 12);
    encryptedCodes.push(hash);
  }
  
  return encryptedCodes;
}

/**
 * Verify recovery code and mark as used
 */
export async function verifyRecoveryCode(
  userId: string, 
  recoveryCode: string
): Promise<boolean> {
  const user = await withSystemRole(async (tx) => {
    return tx.user.findUnique({
      where: { id: userId },
      select: { mfaRecoveryCodes: true },
    });
  });

  if (!user?.mfaRecoveryCodes) {
    return false;
  }

  // Check each recovery code
  for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
    const encryptedCode = user.mfaRecoveryCodes[i];
    if (!encryptedCode) continue;

    const isMatch = await bcrypt.compare(recoveryCode, encryptedCode);
    if (isMatch) {
      // Mark code as used by removing it
      const updatedCodes = [...user.mfaRecoveryCodes];
      updatedCodes[i] = ""; // Mark as used
      
      await withSystemRole(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            mfaRecoveryCodes: updatedCodes,
            mfaVerifiedAt: new Date(),
          },
        });
      });

      return true;
    }
  }

  return false;
}

/**
 * MFA Status and Requirements
 */

/**
 * Check if user requires fresh MFA verification
 */
export function requiresFreshMfa(
  mfaVerifiedAt: Date | null,
  action: string
): boolean {
  if (!mfaVerifiedAt) return true;

  const now = new Date();
  const timeSinceVerification = now.getTime() - mfaVerifiedAt.getTime();
  
  // High-security actions require MFA within 5 minutes
  const highSecurityActions = [
    "issue_override_token",
    "access_security_settings",
    "modify_user_roles",
    "process_refund",
  ];

  if (highSecurityActions.includes(action)) {
    return timeSinceVerification > (5 * 60 * 1000); // 5 minutes
  }

  // Regular privileged actions require MFA within 12 hours
  return timeSinceVerification > (12 * 60 * 60 * 1000); // 12 hours
}

/**
 * Get user's MFA status
 */
export async function getUserMfaStatus(userId: string) {
  return withSystemRole(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        webauthnEnabled: true,
        mfaVerifiedAt: true,
        mfaRecoveryCodes: true,
      },
    });

    const webauthnCredentials = await tx.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const recoveryCodesRemaining = user.mfaRecoveryCodes
      ? user.mfaRecoveryCodes.filter(code => code !== "").length
      : 0;

    return {
      totpEnabled: user.totpEnabled,
      webauthnEnabled: user.webauthnEnabled,
      webauthnCredentials,
      recoveryCodesRemaining,
      mfaVerifiedAt: user.mfaVerifiedAt,
      requiresFreshMfa: (action: string) => 
        requiresFreshMfa(user.mfaVerifiedAt, action),
    };
  });
}

/**
 * Utility functions
 */

/**
 * Encrypt sensitive data for storage
 */
export function encryptSecret(data: string): string {
  const algorithm = "aes-256-gcm";
  const key = crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data from storage
 */
export function decryptSecret(encryptedData: string): string {
  const algorithm = "aes-256-gcm";
  const key = crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
  
  const parts = encryptedData.split(":");
  if (parts.length < 2) {
    throw new Error("Invalid encrypted data format");
  }
  
  const iv = Buffer.from(parts[0]!, "hex");
  const encrypted = parts[1]!;
  
  const decipher = crypto.createDecipher(algorithm, key);
  const decrypted = decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  
  return decrypted;
}
