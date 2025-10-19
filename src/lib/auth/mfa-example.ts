/**
 * MFA Usage Examples
 * 
 * This file demonstrates how to use the MFA system in your application.
 * These are example code snippets showing the flow for TOTP and WebAuthn enrollment/verification.
 */

import { 
  generateTotpSecret, 
  verifyTotpCode, 
  enableTotpForUser, 
  generateRecoveryCodes, 
  encryptRecoveryCodes,
  verifyRecoveryCode,
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication,
  getUserMfaStatus,
  requiresFreshMfa,
  encryptSecret,
  decryptSecret
} from "./mfa";
import { requireMfaForAction } from "./mfa-guards";

/**
 * TOTP Enrollment Flow Example
 */
export async function exampleTotpEnrollment(userId: string, userEmail: string) {
  // 1. Generate TOTP secret and QR code
  const totpSetup = await generateTotpSecret(userId, userEmail);
  
  console.log("TOTP Setup:", {
    qrCodeUrl: totpSetup.qrCodeUrl, // Show this QR code to user
    manualEntryKey: totpSetup.manualEntryKey, // Or let them enter this manually
  });

  // 2. User scans QR code and enters the 6-digit code from their authenticator app
  const userEnteredCode = "123456"; // This comes from user input
  
  // 3. Verify the code
  const isValidCode = verifyTotpCode(totpSetup.secret, userEnteredCode);
  
  if (isValidCode) {
    // 4. Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const encryptedRecoveryCodes = await encryptRecoveryCodes(recoveryCodes);
    
    // 5. Encrypt and store the TOTP secret
    const encryptedSecret = encryptSecret(totpSetup.secret);
    
    // 6. Enable TOTP for the user
    await enableTotpForUser(userId, encryptedSecret, encryptedRecoveryCodes);
    
    console.log("TOTP enabled successfully!");
    console.log("Recovery codes (show these to user):", recoveryCodes);
    
    return { success: true, recoveryCodes };
  } else {
    return { success: false, error: "Invalid TOTP code" };
  }
}

/**
 * TOTP Verification Flow Example
 */
export async function exampleTotpVerification(userId: string, userCode: string) {
  // 1. Get user's encrypted TOTP secret from database
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });
  
  if (!user?.totpEnabled || !user.totpSecret) {
    return { success: false, error: "TOTP not enabled for this user" };
  }
  
  // 2. Decrypt the secret
  const decryptedSecret = decryptSecret(user.totpSecret);
  
  // 3. Verify the code
  const isValid = verifyTotpCode(decryptedSecret, userCode);
  
  if (isValid) {
    // Update mfaVerifiedAt timestamp
    await db.user.update({
      where: { id: userId },
      data: { mfaVerifiedAt: new Date() },
    });
    
    return { success: true };
  } else {
    return { success: false, error: "Invalid TOTP code" };
  }
}

/**
 * WebAuthn Registration Flow Example
 */
export async function exampleWebAuthnRegistration(
  userId: string, 
  userName: string, 
  userEmail: string
) {
  // 1. Generate registration options
  const registrationOptions = await generateWebAuthnRegistrationOptions(
    userId, 
    userName, 
    userEmail
  );
  
  console.log("Send these options to the client:", registrationOptions);
  
  // 2. Client side: navigator.credentials.create() with these options
  // This returns a credential that gets sent back to the server
  
  // 3. Server side: verify the registration response
  const mockRegistrationResponse = {}; // This would come from the client
  const expectedChallenge = registrationOptions.challenge;
  
  const verification = await verifyWebAuthnRegistration(
    userId,
    mockRegistrationResponse,
    expectedChallenge,
    "My Security Key"
  );
  
  if (verification.verified) {
    console.log("WebAuthn credential registered successfully!");
    console.log("Credential ID:", verification.credentialId);
    return { success: true, credentialId: verification.credentialId };
  } else {
    return { success: false, error: "WebAuthn registration failed" };
  }
}

/**
 * WebAuthn Authentication Flow Example
 */
export async function exampleWebAuthnAuthentication(userId: string) {
  // 1. Generate authentication options
  const authenticationOptions = await generateWebAuthnAuthenticationOptions(userId);
  
  console.log("Send these options to the client:", authenticationOptions);
  
  // 2. Client side: navigator.credentials.get() with these options
  // This returns a credential that gets sent back to the server
  
  // 3. Server side: verify the authentication response
  const mockAuthenticationResponse = {}; // This would come from the client
  const expectedChallenge = authenticationOptions.challenge;
  
  const verification = await verifyWebAuthnAuthentication(
    mockAuthenticationResponse,
    expectedChallenge,
    userId
  );
  
  if (verification.verified) {
    console.log("WebAuthn authentication successful!");
    return { success: true, userId: verification.userId };
  } else {
    return { success: false, error: "WebAuthn authentication failed" };
  }
}

/**
 * Recovery Code Usage Example
 */
export async function exampleRecoveryCodeUsage(userId: string, recoveryCode: string) {
  const isValid = await verifyRecoveryCode(userId, recoveryCode);
  
  if (isValid) {
    console.log("Recovery code verified successfully!");
    // The recovery code is automatically marked as used
    return { success: true };
  } else {
    return { success: false, error: "Invalid or already used recovery code" };
  }
}

/**
 * MFA Status Check Example
 */
export async function exampleMfaStatusCheck(userId: string) {
  const status = await getUserMfaStatus(userId);
  
  console.log("MFA Status:", {
    totpEnabled: status.totpEnabled,
    webauthnEnabled: status.webauthnEnabled,
    webauthnCredentials: status.webauthnCredentials,
    recoveryCodesRemaining: status.recoveryCodesRemaining,
    mfaVerifiedAt: status.mfaVerifiedAt,
  });
  
  // Check if user needs fresh MFA for specific actions
  console.log("Needs MFA for high-security action:", status.requiresFreshMfa("issue_override_token"));
  console.log("Needs MFA for regular action:", status.requiresFreshMfa("access_dashboard"));
  
  return status;
}

/**
 * API Route MFA Guard Example
 */
export async function exampleApiMfaGuard(userId: string, userRole: string, action: string) {
  const mfaCheck = await requireMfaForAction(userId, userRole, action);
  
  if (!mfaCheck.success) {
    console.log("MFA required:", mfaCheck.error, mfaCheck.code);
    // Return 403 error with MFA requirement
    return { 
      status: 403, 
      body: { 
        success: false, 
        error: mfaCheck.error, 
        code: mfaCheck.code 
      } 
    };
  }
  
  // MFA requirements satisfied, proceed with the action
  console.log("MFA check passed, proceeding with action");
  return { status: 200, body: { success: true } };
}

/**
 * Client-Side JavaScript Examples (for frontend integration)
 */
export const clientSideExamples = {
  
  // TOTP Setup
  async setupTOTP() {
    const response = await fetch("/api/auth/mfa/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    const data = await response.json();
    if (data.success) {
      // Show QR code to user: data.qrCodeUrl
      // Show recovery codes: data.recoveryCodes
    }
  },
  
  // TOTP Verification
  async verifyTOTP(code: string) {
    const response = await fetch("/api/auth/mfa/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    
    return response.json();
  },
  
  // WebAuthn Registration
  async registerWebAuthn() {
    // Start registration
    const startResponse = await fetch("/api/auth/mfa/webauthn/register", {
      method: "GET",
    });
    const { options } = await startResponse.json();
    
    // Create credential
    const credential = await navigator.credentials.create({ publicKey: options });
    
    // Complete registration
    const completeResponse = await fetch("/api/auth/mfa/webauthn/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, credentialName: "My Security Key" }),
    });
    
    return completeResponse.json();
  },
  
  // WebAuthn Authentication
  async authenticateWebAuthn() {
    // Start authentication
    const startResponse = await fetch("/api/auth/mfa/webauthn/authenticate", {
      method: "GET",
    });
    const { options } = await startResponse.json();
    
    // Get credential
    const credential = await navigator.credentials.get({ publicKey: options });
    
    // Complete authentication
    const completeResponse = await fetch("/api/auth/mfa/webauthn/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    
    return completeResponse.json();
  },
  
  // Recovery Code Verification
  async verifyRecoveryCode(code: string) {
    const response = await fetch("/api/auth/mfa/recovery/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recoveryCode: code }),
    });
    
    return response.json();
  },
  
  // Get MFA Status
  async getMfaStatus() {
    const response = await fetch("/api/auth/mfa/status");
    return response.json();
  }
};