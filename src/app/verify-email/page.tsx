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
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setMessage("No verification token provided");
			setIsLoading(false);
			return;
		}

		verifyEmail();
	}, [token]);

	const verifyEmail = async () => {
		try {
			const response = await fetch("/api/auth/verify-email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});

			const result = await response.json();

			if (response.ok) {
				setStatus("success");
				setMessage("Your email has been verified successfully!");
			} else {
				setStatus("error");
				setMessage(result.error || "Failed to verify email");
			}
		} catch (error) {
			console.error("Email verification error:", error);
			setStatus("error");
			setMessage("An error occurred while verifying your email");
		} finally {
			setIsLoading(false);
		}
	};

	const handleContinue = () => {
		router.push("/login");
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						Email Verification
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						Verify your email address to complete your account setup
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-center">
							{status === "verifying" && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
							{status === "success" && <CheckCircle className="mr-2 h-5 w-5 text-green-600" />}
							{status === "error" && <XCircle className="mr-2 h-5 w-5 text-red-600" />}
							{status === "verifying" && "Verifying Email"}
							{status === "success" && "Email Verified"}
							{status === "error" && "Verification Failed"}
						</CardTitle>
						<CardDescription>
							{status === "verifying" && "Please wait while we verify your email address..."}
							{status === "success" && "Your email address has been successfully verified."}
							{status === "error" && "There was a problem verifying your email address."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{status === "verifying" && (
							<div className="text-center">
								<Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<p className="text-gray-600">Verifying your email address...</p>
							</div>
						)}

						{status === "success" && (
							<div className="text-center">
								<CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
								<Alert className="mb-4">
									<AlertDescription>{message}</AlertDescription>
								</Alert>
								<Button onClick={handleContinue} className="w-full">
									Continue to Login
								</Button>
							</div>
						)}

						{status === "error" && (
							<div className="text-center">
								<XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
								<Alert variant="destructive" className="mb-4">
									<AlertDescription>{message}</AlertDescription>
								</Alert>
								<Button onClick={handleContinue} className="w-full">
									Return to Login
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="text-center">
					<p className="text-gray-500 text-xs">
						If you didn't receive a verification email, please check your spam folder
						or contact support.
					</p>
				</div>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		}>
			<VerifyEmailContent />
		</Suspense>
	);
}
