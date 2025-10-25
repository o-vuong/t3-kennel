"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
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

interface TOTPSetupResponse {
	qrCode: string;
	secret: string;
	recoveryCodes: string[];
}

interface MFAStatus {
	totpEnabled: boolean;
	webauthnEnabled: boolean;
	lastVerifiedAt: string | null;
}

function MFASetupContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/dashboard";

	const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
	const [totpSetup, setTotpSetup] = useState<TOTPSetupResponse | null>(null);
	const [totpCode, setTotpCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

	useEffect(() => {
		fetchMFAStatus();
	}, [fetchMFAStatus]);

	const fetchMFAStatus = async () => {
		try {
			const response = await fetch("/api/auth/mfa/status");
			if (response.ok) {
				const status = await response.json();
				setMfaStatus(status);
			}
		} catch (error) {
			console.error("Failed to fetch MFA status:", error);
		}
	};

	const setupTOTP = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/mfa/totp/setup", {
				method: "POST",
			});

			if (response.ok) {
				const data = await response.json();
				setTotpSetup(data);
				setRecoveryCodes(data.recoveryCodes);
			} else {
				const errorData = await response.json();
				setError(errorData.error || "Failed to setup TOTP");
			}
		} catch (_error) {
			setError("Failed to setup TOTP");
		} finally {
			setIsLoading(false);
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
				setSuccess("TOTP successfully enabled!");
				setTotpSetup(null);
				setTotpCode("");
				await fetchMFAStatus();
				setTimeout(() => {
					router.push(redirectTo);
				}, 2000);
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

	const setupWebAuthn = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/mfa/webauthn/register", {
				method: "POST",
			});

			if (response.ok) {
				const options = await response.json();

				// Use WebAuthn API to register
				const credential = await navigator.credentials.create({
					publicKey: {
						...options,
						challenge: new Uint8Array(Object.values(options.challenge)),
						user: {
							...options.user,
							id: new Uint8Array(Object.values(options.user.id)),
						},
					},
				});

				if (credential) {
					const publicKeyCredential = credential as PublicKeyCredential;
					const verifyResponse = await fetch(
						"/api/auth/mfa/webauthn/register",
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
										attestationObject: Array.from(
											new Uint8Array(
												(
													publicKeyCredential.response as AuthenticatorAttestationResponse
												).attestationObject
											)
										),
										clientDataJSON: Array.from(
											new Uint8Array(
												(
													publicKeyCredential.response as AuthenticatorAttestationResponse
												).clientDataJSON
											)
										),
									},
									type: publicKeyCredential.type,
								},
							}),
						}
					);

					if (verifyResponse.ok) {
						setSuccess("WebAuthn successfully enabled!");
						await fetchMFAStatus();
						setTimeout(() => {
							router.push(redirectTo);
						}, 2000);
					} else {
						const errorData = await verifyResponse.json();
						setError(
							errorData.error || "Failed to verify WebAuthn registration"
						);
					}
				}
			} else {
				const errorData = await response.json();
				setError(errorData.error || "Failed to setup WebAuthn");
			}
		} catch (_error) {
			setError("WebAuthn not supported or failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center font-extrabold text-3xl text-gray-900">
						Multi-Factor Authentication Setup
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						Secure your account with additional authentication methods
					</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{success && (
					<Alert>
						<AlertDescription>{success}</AlertDescription>
					</Alert>
				)}

				{mfaStatus && (
					<Card>
						<CardHeader>
							<CardTitle>Current MFA Status</CardTitle>
							<CardDescription>
								Your current multi-factor authentication setup
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<span>TOTP (Authenticator App)</span>
								<Badge
									variant={mfaStatus.totpEnabled ? "default" : "secondary"}
								>
									{mfaStatus.totpEnabled ? "Enabled" : "Disabled"}
								</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span>WebAuthn (Security Key)</span>
								<Badge
									variant={mfaStatus.webauthnEnabled ? "default" : "secondary"}
								>
									{mfaStatus.webauthnEnabled ? "Enabled" : "Disabled"}
								</Badge>
							</div>
							{mfaStatus.lastVerifiedAt && (
								<div className="text-gray-600 text-sm">
									Last verified:{" "}
									{new Date(mfaStatus.lastVerifiedAt).toLocaleString()}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{!mfaStatus?.totpEnabled && (
					<Card>
						<CardHeader>
							<CardTitle>Setup TOTP (Authenticator App)</CardTitle>
							<CardDescription>
								Use an authenticator app like Google Authenticator or Authy
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{!totpSetup ? (
								<Button
									onClick={setupTOTP}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "Setting up..." : "Setup TOTP"}
								</Button>
							) : (
								<div className="space-y-4">
									<div className="text-center">
										<p className="mb-2 text-gray-600 text-sm">
											Scan this QR code with your authenticator app:
										</p>
										<img
											src={totpSetup.qrCode}
											alt="TOTP QR Code"
											className="mx-auto"
										/>
									</div>
									<div>
										<Label htmlFor="totp-code">
											Enter 6-digit code from your app:
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
										{isLoading ? "Verifying..." : "Verify & Enable TOTP"}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{!mfaStatus?.webauthnEnabled && (
					<Card>
						<CardHeader>
							<CardTitle>Setup WebAuthn (Security Key)</CardTitle>
							<CardDescription>
								Use a hardware security key or biometric authentication
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={setupWebAuthn}
								disabled={isLoading}
								className="w-full"
							>
								{isLoading ? "Setting up..." : "Setup WebAuthn"}
							</Button>
						</CardContent>
					</Card>
				)}

				{recoveryCodes.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Recovery Codes</CardTitle>
							<CardDescription>
								Save these codes in a secure location. You can use them to
								access your account if you lose your authenticator device.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-2 font-mono text-sm">
								{recoveryCodes.map((code, index) => (
									<div key={index} className="rounded bg-gray-100 p-2">
										{code}
									</div>
								))}
							</div>
							<p className="mt-2 text-gray-600 text-xs">
								Each code can only be used once. Generate new codes if needed.
							</p>
						</CardContent>
					</Card>
				)}

				<div className="text-center">
					<Button
						variant="outline"
						onClick={() => router.push(redirectTo)}
						disabled={isLoading}
					>
						Skip for now
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function MFASetupPage() {
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
			<MFASetupContent />
		</Suspense>
	);
}
