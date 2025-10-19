import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from "@simplewebauthn/server";
// WebAuthn types are available from the main package
import { db } from "~/server/db";
import { env } from "~/env";

// TOTP Functions
export async function generateTOTPSecret(userId: string) {
	const secret = speakeasy.generateSecret({
		name: `Kennel Management (${userId})`,
		issuer: "Kennel Management System",
		length: 32,
	});

	// Generate recovery codes
	const recoveryCodes = Array.from({ length: 10 }, () =>
		Math.random().toString(36).substring(2, 8).toUpperCase(),
	);

	// Encrypt and store secret and recovery codes
	const encryptedSecret = encrypt(secret.base32);
	const encryptedRecoveryCodes = recoveryCodes.map((code) => encrypt(code));

	await db.user.update({
		where: { id: userId },
		data: {
			totpSecret: encryptedSecret,
			mfaRecoveryCodes: encryptedRecoveryCodes,
		},
	});

	// Generate QR code
	const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

	return {
		secret: secret.base32,
		qrCode: qrCodeDataURL,
		recoveryCodes,
	};
}

export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { totpSecret: true },
	});

	if (!user?.totpSecret) {
		return false;
	}

	const decryptedSecret = decrypt(user.totpSecret);
	const verified = speakeasy.totp.verify({
		secret: decryptedSecret,
		encoding: "base32",
		token,
		window: 2, // Allow 2 time steps before/after
	});

	if (verified) {
		// Update last MFA verification time
		await db.user.update({
			where: { id: userId },
			data: { mfaVerifiedAt: new Date() },
		});
	}

	return verified;
}

export async function verifyRecoveryCode(
	userId: string,
	code: string,
): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { mfaRecoveryCodes: true },
	});

	if (!user?.mfaRecoveryCodes) {
		return false;
	}

	const encryptedCode = encrypt(code.toUpperCase());
	const codeIndex = user.mfaRecoveryCodes.indexOf(encryptedCode);

	if (codeIndex === -1) {
		return false;
	}

	// Remove used recovery code
	const updatedCodes = user.mfaRecoveryCodes.filter((_, index) => index !== codeIndex);
	await db.user.update({
		where: { id: userId },
		data: {
			mfaRecoveryCodes: updatedCodes,
			mfaVerifiedAt: new Date(),
		},
	});

	return true;
}

// WebAuthn Functions
export async function generateWebAuthnRegistrationOptions(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, email: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	const options = await generateRegistrationOptions({
		rpName: "Kennel Management System",
		rpID: new URL(env.BETTER_AUTH_URL).hostname,
		userID: Buffer.from(user.id, "utf8"),
		userName: user.email,
		userDisplayName: user.email,
		attestationType: "none",
		authenticatorSelection: {
			authenticatorAttachment: "platform",
			userVerification: "preferred",
		},
	});

	// Store challenge in session or temporary storage
	// For now, we'll store it in a simple in-memory cache
	// In production, use Redis or database
	webAuthnChallenges.set(userId, options.challenge);

	return options;
}

export async function verifyWebAuthnRegistration(
	userId: string,
	response: any,
): Promise<boolean> {
	const challenge = webAuthnChallenges.get(userId);
	if (!challenge) {
		return false;
	}

	try {
		const verification = await verifyRegistrationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: env.BETTER_AUTH_URL,
			expectedRPID: new URL(env.BETTER_AUTH_URL).hostname,
		});

		if (verification.verified && verification.registrationInfo) {
			// Store credential
			await db.webAuthnCredential.create({
				data: {
					userId,
					credentialId: Buffer.from(verification.registrationInfo.credential.id).toString("base64url"),
					publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString("base64url"),
					counter: verification.registrationInfo.credential.counter,
					deviceType: "unknown",
					transports: response.response.transports || [],
				},
			});

			// Update user MFA status
			await db.user.update({
				where: { id: userId },
				data: {
					webauthnEnabled: true,
					mfaVerifiedAt: new Date(),
				},
			});

			webAuthnChallenges.delete(userId);
			return true;
		}
	} catch (error) {
		console.error("WebAuthn registration verification failed:", error);
	}

	return false;
}

export async function generateWebAuthnAuthenticationOptions(userId: string) {
	const credentials = await db.webAuthnCredential.findMany({
		where: { userId },
		select: { credentialId: true },
	});

	const options = await generateAuthenticationOptions({
		rpID: new URL(env.BETTER_AUTH_URL).hostname,
		allowCredentials: credentials.map((cred) => ({
			id: cred.credentialId,
			type: "public-key",
		})),
		userVerification: "preferred",
	});

	webAuthnChallenges.set(userId, options.challenge);
	return options;
}

export async function verifyWebAuthnAuthentication(
	userId: string,
	response: any,
): Promise<boolean> {
	const challenge = webAuthnChallenges.get(userId);
	if (!challenge) {
		return false;
	}

	const credential = await db.webAuthnCredential.findUnique({
		where: { credentialId: response.id },
	});

	if (!credential) {
		return false;
	}

	try {
		const verification = await verifyAuthenticationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: env.BETTER_AUTH_URL,
			expectedRPID: new URL(env.BETTER_AUTH_URL).hostname,
			credential: {
				id: Buffer.from(credential.credentialId, "base64url") as any,
				publicKey: Buffer.from(credential.publicKey, "base64url") as any,
				counter: credential.counter,
			},
		});

		if (verification.verified) {
			// Update counter and last used
			await db.webAuthnCredential.update({
				where: { id: credential.id },
				data: {
					counter: verification.authenticationInfo.newCounter,
					lastUsedAt: new Date(),
				},
			});

			// Update user MFA verification time
			await db.user.update({
				where: { id: userId },
				data: { mfaVerifiedAt: new Date() },
			});

			webAuthnChallenges.delete(userId);
			return true;
		}
	} catch (error) {
		console.error("WebAuthn authentication verification failed:", error);
	}

	return false;
}

// MFA Status and Enforcement
export async function getMFAStatus(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			totpEnabled: true,
			webauthnEnabled: true,
			mfaVerifiedAt: true,
			mfaRecoveryCodes: true,
		},
	});

	if (!user) {
		return null;
	}

	return {
		totpEnabled: user.totpEnabled,
		webauthnEnabled: user.webauthnEnabled,
		lastVerified: user.mfaVerifiedAt,
		hasRecoveryCodes: user.mfaRecoveryCodes.length > 0,
	};
}

export function isMFARequired(role: string): boolean {
	return role === "OWNER" || role === "ADMIN";
}

export function isMFAVerifiedRecently(verifiedAt: Date | null, maxAgeMinutes: number = 720): boolean {
	if (!verifiedAt) return false;
	const now = new Date();
	const diffMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60);
	return diffMinutes <= maxAgeMinutes;
}

// Simple encryption/decryption for secrets (use proper encryption in production)
function encrypt(text: string): string {
	// In production, use proper encryption with the ENCRYPTION_KEY
	// This is a placeholder implementation
	return Buffer.from(text).toString("base64");
}

function decrypt(encryptedText: string): string {
	// In production, use proper decryption with the ENCRYPTION_KEY
	// This is a placeholder implementation
	return Buffer.from(encryptedText, "base64").toString();
}

// In-memory challenge storage (use Redis in production)
const webAuthnChallenges = new Map<string, string>();