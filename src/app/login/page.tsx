"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

import { useSession } from "~/lib/auth/client";
import { DEFAULT_HOME_PATH, parseUserRole, ROLE_HOME } from "~/lib/auth/roles";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const router = useRouter();
	const {
		data: session,
		isPending: sessionPending,
		refetch: refetchSession,
	} = useSession();

	useEffect(() => {
		if (!session) {
			return;
		}

		const role = parseUserRole((session.user as { role?: unknown })?.role);
		const target = role
			? (ROLE_HOME[role] ?? DEFAULT_HOME_PATH)
			: DEFAULT_HOME_PATH;

		router.replace(target);
	}, [session, router]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
					rememberMe: true,
				}),
			});

			const result = await response.json().catch(() => null);

			if (!response.ok || result?.error) {
				const message =
					typeof result?.error === "string"
						? result.error
						: (result?.error?.message ?? "Invalid email or password");
				setError(message);
				return;
			}

			const resolvedRole = parseUserRole(
				result?.user?.role ?? result?.session?.user?.role
			);
			if (resolvedRole) {
				const target = ROLE_HOME[resolvedRole] ?? DEFAULT_HOME_PATH;
				router.replace(target);
				return;
			}

			await refetchSession();
		} catch (err) {
			console.error("Login failed", err);
			setError("Unable to sign in. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const isDisabled =
		isSubmitting ||
		sessionPending ||
		email.trim().length === 0 ||
		password.trim().length === 0;

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						Kennel Management System
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						HIPAA-compliant dog kennel management
					</p>
				</div>

				<Card
					className={sessionPending ? "pointer-events-none opacity-70" : ""}
				>
					<CardHeader>
						<CardTitle>Sign in to your account</CardTitle>
						<CardDescription>
							Enter your email and password to access the system
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
									disabled={isDisabled}
									autoComplete="email"
									placeholder="Enter your email"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										disabled={isDisabled}
										autoComplete="current-password"
										placeholder="Enter your password"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowPassword((prev) => !prev)}
										disabled={isDisabled}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={isDisabled}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing in...
									</>
								) : (
									"Sign in"
								)}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
								<h3 className="mb-2 font-medium text-blue-800 text-sm">
									Demo Credentials
								</h3>
								<div className="space-y-1 text-blue-700 text-xs">
									<div>
										<strong>Owner:</strong> owner@kennel.com / owner123
									</div>
									<div>
										<strong>Admin:</strong> admin@kennel.com / admin123
									</div>
									<div>
										<strong>Staff:</strong> staff@kennel.com / staff123
									</div>
									<div>
										<strong>Customer:</strong> customer@example.com /
										customer123
									</div>
								</div>
							</div>
							<p className="text-gray-600 text-sm">
								Don&apos;t have an account?{" "}
								<Button variant="link" className="h-auto p-0">
									Contact your administrator
								</Button>
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="text-center">
					<p className="text-gray-500 text-xs">
						This system is HIPAA-compliant and uses enterprise-grade security
					</p>
				</div>
			</div>
		</div>
	);
}
