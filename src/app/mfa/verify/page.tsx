"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface MFAStatus {
	totpEnabled: boolean;
	webauthnEnabled: boolean;
	lastVerifiedAt: string | null;
}

function MFAVerifyContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/dashboard";
	const requiresFresh = searchParams.get("fresh") === "true";

	const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
	const [totpCode, setTotpCode] = useState("");
	const [recoveryCode, setRecoveryCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeMethod, setActiveMethod] = useState<
		"totp" | "webauthn" | "recovery"
	>("totp");

	useEffect(() => {
		fetchMFAStatus();
	}, [fetchMFAStatus]);

	const fetchMFAStatus = async () => {
		try {
			const response = await fetch("/api/auth/mfa/status");
			if (response.ok) {
				const status = await response.json();
				setMfaStatus(status);

				// If no MFA is enabled, redirect to setup
				if (!status.totpEnabled && !status.webauthnEnabled) {
					router.push(`/mfa/setup?redirect=${encodeURIComponent(redirectTo)}`);
				}
			}
		} catch (error) {
			console.error("Failed to fetch MFA status:", error);
		}
	};

	const verifyTOTP = async () => {
		if (!totpCode || totpCode.length !== 6) {
			setError("Please enter a valid 6-digit code");
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/mfa/totp/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token: totpCode }),
			});

			if (response.ok) {
				router.push(redirectTo);
			} else {
				const errorData = await response.json();
				setError(errorData.error || "Invalid TOTP code");
			}
		} catch (_error) {
			setError("Failed to verify TOTP code");
		} finally {
			setIsLoading(false);
		}
	};

	const verifyWebAuthn = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/mfa/webauthn/authenticate", {
				method: "POST",
			});

			if (response.ok) {
				const options = await response.json();

				// Use WebAuthn API to authenticate
				const credential = await navigator.credentials.get({
					publicKey: {
						...options,
						challenge: new Uint8Array(Object.values(options.challenge)),
						allowCredentials: options.allowCredentials?.map((cred: any) => ({
							...cred,
							id: new Uint8Array(Object.values(cred.id)),
						})),
					},
				});

				if (credential) {
					const publicKeyCredential = credential as PublicKeyCredential;
					const authResponse =
						publicKeyCredential.response as AuthenticatorAssertionResponse;
					const verifyResponse = await fetch(
						"/api/auth/mfa/webauthn/authenticate",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								credential: {
									id: publicKeyCredential.id,
									rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
									response: {
										authenticatorData: Array.from(
											new Uint8Array(authResponse.authenticatorData)
										),
										clientDataJSON: Array.from(
											new Uint8Array(authResponse.clientDataJSON)
										),
										signature: Array.from(
											new Uint8Array(authResponse.signature)
										),
										userHandle: authResponse.userHandle
											? Array.from(new Uint8Array(authResponse.userHandle))
											: null,
									},
									type: publicKeyCredential.type,
								},
							}),
						}
					);

					if (verifyResponse.ok) {
						router.push(redirectTo);
					} else {
						const errorData = await verifyResponse.json();
						setError(
							errorData.error || "Failed to verify WebAuthn authentication"
						);
					}
				}
			} else {
				const errorData = await response.json();
				setError(
					errorData.error || "Failed to initiate WebAuthn authentication"
				);
			}
		} catch (_error) {
			setError("WebAuthn not supported or failed");
		} finally {
			setIsLoading(false);
		}
	};

	const verifyRecoveryCode = async () => {
		if (!recoveryCode.trim()) {
			setError("Please enter a recovery code");
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/mfa/recovery/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code: recoveryCode }),
			});

			if (response.ok) {
				router.push(redirectTo);
			} else {
				const errorData = await response.json();
				setError(errorData.error || "Invalid recovery code");
			}
		} catch (_error) {
			setError("Failed to verify recovery code");
		} finally {
			setIsLoading(false);
		}
	};

	if (!mfaStatus) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2"></div>
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center font-extrabold text-3xl text-gray-900">
						Multi-Factor Authentication Required
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						{requiresFresh
							? "Fresh authentication required for this action"
							: "Please verify your identity to continue"}
					</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Choose Verification Method</CardTitle>
						<CardDescription>
							Select how you'd like to verify your identity
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex space-x-2">
							{mfaStatus.totpEnabled && (
								<Button
									variant={activeMethod === "totp" ? "default" : "outline"}
									onClick={() => setActiveMethod("totp")}
									className="flex-1"
								>
									TOTP
								</Button>
							)}
							{mfaStatus.webauthnEnabled && (
								<Button
									variant={activeMethod === "webauthn" ? "default" : "outline"}
									onClick={() => setActiveMethod("webauthn")}
									className="flex-1"
								>
									WebAuthn
								</Button>
							)}
							<Button
								variant={activeMethod === "recovery" ? "default" : "outline"}
								onClick={() => setActiveMethod("recovery")}
								className="flex-1"
							>
								Recovery Code
							</Button>
						</div>

						{activeMethod === "totp" && mfaStatus.totpEnabled && (
							<div className="space-y-4">
								<div>
									<Label htmlFor="totp-code">
										Enter 6-digit code from your authenticator app:
									</Label>
									<Input
										id="totp-code"
										type="text"
										value={totpCode}
										onChange={(e) => setTotpCode(e.target.value)}
										placeholder="123456"
										maxLength={6}
										className="mt-1"
									/>
								</div>
								<Button
									onClick={verifyTOTP}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "Verifying..." : "Verify TOTP"}
								</Button>
							</div>
						)}

						{activeMethod === "webauthn" && mfaStatus.webauthnEnabled && (
							<div className="space-y-4">
								<p className="text-gray-600 text-sm">
									Click the button below to use your security key or biometric
									authentication.
								</p>
								<Button
									onClick={verifyWebAuthn}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "Authenticating..." : "Verify with WebAuthn"}
								</Button>
							</div>
						)}

						{activeMethod === "recovery" && (
							<div className="space-y-4">
								<div>
									<Label htmlFor="recovery-code">
										Enter your recovery code:
									</Label>
									<Input
										id="recovery-code"
										type="text"
										value={recoveryCode}
										onChange={(e) => setRecoveryCode(e.target.value)}
										placeholder="Enter recovery code"
										className="mt-1"
									/>
								</div>
								<Button
									onClick={verifyRecoveryCode}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "Verifying..." : "Verify Recovery Code"}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="text-center">
					<Button
						variant="outline"
						onClick={() =>
							router.push(
								`/mfa/setup?redirect=${encodeURIComponent(redirectTo)}`
							)
						}
						disabled={isLoading}
					>
						Setup MFA
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function MFAVerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2"></div>
						<p className="mt-2 text-gray-600">Loading...</p>
					</div>
				</div>
			}
		>
			<MFAVerifyContent />
		</Suspense>
	);
}
