"use client";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
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

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

	useEffect(() => {
		if (!token) {
			setIsValidToken(false);
			setError("No reset token provided");
			return;
		}

		// Validate token on component mount
		validateToken();
	}, [token]);

	const validateToken = async () => {
		try {
			const response = await fetch("/api/auth/validate-reset-token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});

			if (response.ok) {
				setIsValidToken(true);
			} else {
				const result = await response.json();
				setIsValidToken(false);
				setError(result.error || "Invalid or expired reset token");
			}
		} catch (error) {
			console.error("Token validation error:", error);
			setIsValidToken(false);
			setError("Failed to validate reset token");
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords don't match");
			setIsSubmitting(false);
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			setIsSubmitting(false);
			return;
		}

		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					password,
					confirmPassword,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				// Redirect to login with success message
				router.push("/login?message=Password reset successfully. Please sign in with your new password.");
			} else {
				setError(result.error || "Failed to reset password");
			}
		} catch (err) {
			console.error("Password reset failed", err);
			setError("Unable to reset password. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isValidToken === null) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Validating reset token...</p>
				</div>
			</div>
		);
	}

	if (isValidToken === false) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<h2 className="mt-6 font-bold text-3xl text-gray-900">
							Invalid Reset Link
						</h2>
						<p className="mt-2 text-gray-600 text-sm">
							This password reset link is invalid or has expired
						</p>
					</div>

					<Card>
						<CardContent className="pt-6">
							<Alert variant="destructive" className="mb-4">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
							<Button asChild className="w-full">
								<Link href="/forgot-password">
									Request New Reset Link
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						Reset Password
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						Enter your new password below
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Set New Password</CardTitle>
						<CardDescription>
							Choose a strong password for your account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{error ? (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							) : null}

							<div className="space-y-2">
								<Label htmlFor="password">New Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										disabled={isSubmitting}
										autoComplete="new-password"
										placeholder="Enter your new password"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowPassword((prev) => !prev)}
										disabled={isSubmitting}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<div className="relative">
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(event) => setConfirmPassword(event.target.value)}
										required
										disabled={isSubmitting}
										autoComplete="new-password"
										placeholder="Confirm your new password"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowConfirmPassword((prev) => !prev)}
										disabled={isSubmitting}
									>
										{showConfirmPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={isSubmitting || !password || !confirmPassword}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Resetting Password...
									</>
								) : (
									"Reset Password"
								)}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<Button variant="link" asChild>
								<Link href="/login">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Login
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className="text-center">
					<p className="text-gray-500 text-xs">
						Password must be at least 8 characters long
					</p>
				</div>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		}>
			<ResetPasswordContent />
		</Suspense>
	);
}
