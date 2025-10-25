"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (response.ok) {
				setIsSubmitted(true);
			} else {
				setError(result.error || "Failed to send reset email");
			}
		} catch (err) {
			console.error("Password reset request failed", err);
			setError("Unable to send reset email. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<h2 className="mt-6 font-bold text-3xl text-gray-900">
							Check Your Email
						</h2>
						<p className="mt-2 text-gray-600 text-sm">
							We've sent a password reset link to your email address
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-center">
								<Mail className="mr-2 h-5 w-5 text-blue-600" />
								Email Sent
							</CardTitle>
							<CardDescription>
								If an account with that email exists, we've sent a password reset link.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center">
								<Mail className="mx-auto h-12 w-12 text-blue-600 mb-4" />
								<p className="text-gray-600 mb-4">
									Please check your email and click the link to reset your password.
								</p>
								<Button asChild className="w-full">
									<Link href="/login">
										<ArrowLeft className="mr-2 h-4 w-4" />
										Return to Login
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<div className="text-center">
						<p className="text-gray-500 text-xs">
							Didn't receive an email? Check your spam folder or try again.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						Forgot Password
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						Enter your email address and we'll send you a reset link
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Reset Your Password</CardTitle>
						<CardDescription>
							Enter your email address and we'll send you a link to reset your password.
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
								<Label htmlFor="email">Email address</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
									disabled={isSubmitting}
									autoComplete="email"
									placeholder="Enter your email address"
								/>
							</div>

							<Button type="submit" className="w-full" disabled={isSubmitting || !email.trim()}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending Reset Link...
									</>
								) : (
									"Send Reset Link"
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
						Remember your password?{" "}
						<Button variant="link" className="h-auto p-0" asChild>
							<Link href="/login">Sign in here</Link>
						</Button>
					</p>
				</div>
			</div>
		</div>
	);
}
