import { describe, it, expect } from "vitest";
import {
	totpEnrollmentSchema,
	totpVerificationSchema,
	totpSetupResponseSchema,
	webauthnRegistrationRequestSchema,
	webauthnRegistrationResponseSchema,
	webauthnAuthenticationResponseSchema,
	recoveryCodeSchema,
	recoveryCodeVerificationSchema,
	regenerateRecoveryCodesSchema,
	mfaChallengeSchema,
	mfaStatusSchema,
	stepUpAuthSchema,
	passwordRequirementsSchema,
	strongPasswordSchema,
} from "./schemas";

describe("Auth Schemas", () => {
	describe("TOTP Schemas", () => {
		describe("totpEnrollmentSchema", () => {
			it("should validate valid TOTP code", () => {
				const validData = { totpCode: "123456" };
				expect(() => totpEnrollmentSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid TOTP codes", () => {
				expect(() => totpEnrollmentSchema.parse({ totpCode: "12345" })).toThrow();
				expect(() => totpEnrollmentSchema.parse({ totpCode: "1234567" })).toThrow();
				expect(() => totpEnrollmentSchema.parse({ totpCode: "abc123" })).toThrow();
				expect(() => totpEnrollmentSchema.parse({ totpCode: "" })).toThrow();
			});
		});

		describe("totpVerificationSchema", () => {
			it("should validate valid TOTP code", () => {
				const validData = { totpCode: "654321" };
				expect(() => totpVerificationSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid TOTP codes", () => {
				expect(() => totpVerificationSchema.parse({ totpCode: "12345" })).toThrow();
				expect(() => totpVerificationSchema.parse({ totpCode: "1234567" })).toThrow();
				expect(() => totpVerificationSchema.parse({ totpCode: "abc123" })).toThrow();
			});
		});

		describe("totpSetupResponseSchema", () => {
			it("should validate valid setup response", () => {
				const validData = {
					qrCodeUrl: "data:image/png;base64,test",
					manualEntryKey: "JBSWY3DPEHPK3PXP",
					recoveryCodes: ["CODE1", "CODE2", "CODE3"],
				};
				expect(() => totpSetupResponseSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid setup response", () => {
				expect(() => totpSetupResponseSchema.parse({})).toThrow();
				expect(() => totpSetupResponseSchema.parse({ qrCodeUrl: "invalid" })).toThrow();
			});
		});
	});

	describe("WebAuthn Schemas", () => {
		describe("webauthnRegistrationRequestSchema", () => {
			it("should validate valid registration request", () => {
				const validData = { name: "My Device" };
				expect(() => webauthnRegistrationRequestSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid registration requests", () => {
				expect(() => webauthnRegistrationRequestSchema.parse({ name: "" })).toThrow();
				expect(() => webauthnRegistrationRequestSchema.parse({ name: "a".repeat(51) })).toThrow();
				expect(() => webauthnRegistrationRequestSchema.parse({})).toThrow();
			});
		});

		describe("webauthnRegistrationResponseSchema", () => {
			it("should validate valid registration response", () => {
				const validData = {
					id: "credential-id",
					rawId: "raw-credential-id",
					response: {
						attestationObject: "attestation-object",
						clientDataJSON: "client-data-json",
					},
					type: "public-key",
					authenticatorAttachment: "platform",
				};
				expect(() => webauthnRegistrationResponseSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid registration responses", () => {
				expect(() => webauthnRegistrationResponseSchema.parse({})).toThrow();
				expect(() => webauthnRegistrationResponseSchema.parse({ id: "test" })).toThrow();
			});
		});

		describe("webauthnAuthenticationResponseSchema", () => {
			it("should validate valid authentication response", () => {
				const validData = {
					id: "credential-id",
					rawId: "raw-credential-id",
					response: {
						authenticatorData: "authenticator-data",
						clientDataJSON: "client-data-json",
						signature: "signature",
					},
					type: "public-key",
					authenticatorAttachment: "cross-platform",
				};
				expect(() => webauthnAuthenticationResponseSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid authentication responses", () => {
				expect(() => webauthnAuthenticationResponseSchema.parse({})).toThrow();
				expect(() => webauthnAuthenticationResponseSchema.parse({ id: "test" })).toThrow();
			});
		});
	});

	describe("Recovery Code Schemas", () => {
		describe("recoveryCodeSchema", () => {
			it("should validate valid recovery codes", () => {
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "CODE12345" })).not.toThrow();
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "CODE-1234" })).not.toThrow();
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "12345678" })).not.toThrow();
			});

			it("should reject invalid recovery codes", () => {
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "code" })).toThrow();
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "CODE" })).toThrow();
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "CODE123456789012345" })).toThrow(); // Too long
				expect(() => recoveryCodeSchema.parse({ recoveryCode: "code-123" })).toThrow();
			});
		});

		describe("recoveryCodeVerificationSchema", () => {
			it("should validate valid recovery code verification", () => {
				expect(() => recoveryCodeVerificationSchema.parse({ recoveryCode: "CODE12345" })).not.toThrow();
			});
		});

		describe("regenerateRecoveryCodesSchema", () => {
			it("should validate valid regeneration request", () => {
				const validData = { currentPassword: "password123" };
				expect(() => regenerateRecoveryCodesSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid regeneration requests", () => {
				expect(() => regenerateRecoveryCodesSchema.parse({ currentPassword: "" })).toThrow();
				expect(() => regenerateRecoveryCodesSchema.parse({})).toThrow();
			});
		});
	});

	describe("MFA Challenge Schema", () => {
		describe("mfaChallengeSchema", () => {
			it("should validate TOTP challenge", () => {
				const validData = { method: "totp", totpCode: "123456" };
				expect(() => mfaChallengeSchema.parse(validData)).not.toThrow();
			});

			it("should validate WebAuthn challenge", () => {
				const validData = {
					method: "webauthn",
					webauthnResponse: {
						id: "credential-id",
						rawId: "raw-credential-id",
						response: {
							authenticatorData: "authenticator-data",
							clientDataJSON: "client-data-json",
							signature: "signature",
						},
						type: "public-key",
					},
				};
				expect(() => mfaChallengeSchema.parse(validData)).not.toThrow();
			});

			it("should validate recovery code challenge", () => {
				const validData = { method: "recovery", recoveryCode: "CODE12345" };
				expect(() => mfaChallengeSchema.parse(validData)).not.toThrow();
			});

			it("should reject invalid challenges", () => {
				expect(() => mfaChallengeSchema.parse({ method: "invalid" })).toThrow();
				expect(() => mfaChallengeSchema.parse({ method: "totp" })).toThrow();
			});
		});
	});

	describe("MFA Status Schema", () => {
		describe("mfaStatusSchema", () => {
			it("should validate valid MFA status", () => {
				const validData = {
					totpEnabled: true,
					webauthnEnabled: false,
					webauthnCredentials: [
						{
							id: "cred-1",
							name: "Device 1",
							deviceType: "platform",
							createdAt: new Date(),
							lastUsedAt: new Date(),
						},
					],
					recoveryCodesRemaining: 5,
					mfaVerifiedAt: new Date(),
					requiresFreshMfa: false,
				};
				expect(() => mfaStatusSchema.parse(validData)).not.toThrow();
			});

			it("should validate minimal MFA status", () => {
				const validData = {
					totpEnabled: false,
					webauthnEnabled: false,
					webauthnCredentials: [],
					recoveryCodesRemaining: 0,
					requiresFreshMfa: true,
				};
				expect(() => mfaStatusSchema.parse(validData)).not.toThrow();
			});
		});
	});

	describe("Step-up Authentication Schema", () => {
		describe("stepUpAuthSchema", () => {
			it("should validate valid step-up auth", () => {
				const validData = {
					action: "issue_override_token",
					mfaMethod: "totp",
					mfaChallenge: { method: "totp", totpCode: "123456" },
				};
				expect(() => stepUpAuthSchema.parse(validData)).not.toThrow();
			});

			it("should validate all valid actions", () => {
				const actions = [
					"issue_override_token",
					"access_security_settings",
					"process_refund",
					"modify_user_roles",
					"access_audit_logs",
					"export_data",
				];

				actions.forEach((action) => {
					const validData = {
						action,
						mfaMethod: "totp",
						mfaChallenge: { method: "totp", totpCode: "123456" },
					};
					expect(() => stepUpAuthSchema.parse(validData)).not.toThrow();
				});
			});

			it("should reject invalid actions", () => {
				const invalidData = {
					action: "invalid_action",
					mfaMethod: "totp",
					mfaChallenge: { method: "totp", totpCode: "123456" },
				};
				expect(() => stepUpAuthSchema.parse(invalidData)).toThrow();
			});
		});
	});

	describe("Password Requirements Schema", () => {
		describe("passwordRequirementsSchema", () => {
			it("should validate with defaults", () => {
				expect(() => passwordRequirementsSchema.parse({})).not.toThrow();
			});

			it("should validate custom requirements", () => {
				const customData = {
					minLength: 16,
					requireUppercase: true,
					requireLowercase: true,
					requireNumbers: true,
					requireSpecialChars: true,
					disallowCommonPasswords: true,
				};
				expect(() => passwordRequirementsSchema.parse(customData)).not.toThrow();
			});
		});
	});

	describe("Strong Password Schema", () => {
		describe("strongPasswordSchema", () => {
			it("should validate strong passwords", () => {
				const strongPasswords = [
					"StrongPassword123!",
					"MySecure@Pass2024",
					"Complex#Password1",
				];

				strongPasswords.forEach((password) => {
					expect(() => strongPasswordSchema.parse(password)).not.toThrow();
				});
			});

			it("should reject weak passwords", () => {
				const weakPasswords = [
					"password", // too short, no numbers, no special chars
					"123456", // too short, no letters
					"Password", // no numbers, no special chars
					"password123", // no uppercase, no special chars
					"PASSWORD123", // no lowercase, no special chars
					"Password123", // no special chars
					"Password!", // no numbers
					"Pass1!", // too short
				];

				weakPasswords.forEach((password) => {
					expect(() => strongPasswordSchema.parse(password)).toThrow();
				});
			});

			it("should reject common passwords", () => {
				const commonPasswords = [
					"password",
					"123456",
					"password123",
					"admin",
					"qwerty",
					"letmein",
					"welcome",
					"monkey",
					"dragon",
					"password1",
				];

				commonPasswords.forEach((password) => {
					expect(() => strongPasswordSchema.parse(password)).toThrow();
				});
			});

			it("should handle case-insensitive common password detection", () => {
				expect(() => strongPasswordSchema.parse("PASSWORD")).toThrow();
				expect(() => strongPasswordSchema.parse("Password")).toThrow();
				expect(() => strongPasswordSchema.parse("ADMIN")).toThrow();
			});
		});
	});
});
