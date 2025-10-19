"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Loader2, ShieldCheck } from "lucide-react";

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
import { api } from "~/trpc/react";

const overrideScopes = [
	{ value: "BOOKING_CAPACITY", label: "Booking capacity" },
	{ value: "PRICING", label: "Pricing override" },
	{ value: "POLICY_BYPASS", label: "Policy bypass" },
	{ value: "REFUND", label: "Refund approval" },
	{ value: "DEPOSIT_WAIVER", label: "Deposit waiver" },
	{ value: "ADMIN_ACTION", label: "Administrative action" },
] as const;

type OverrideScopeValue = (typeof overrideScopes)[number]["value"];

const parseOverrideScope = (value: string): OverrideScopeValue => {
	const match = overrideScopes.find((scope) => scope.value === value);
	return match ? match.value : "ADMIN_ACTION";
};

export default function AdminOverridesPage() {
	const issueTokenMutation = api.admin.issueOverrideToken.useMutation();
	const revokeTokenMutation = api.admin.revokeOverrideToken.useMutation();
	const approveRefundMutation = api.admin.approveRefund.useMutation();

	const [issuedToken, setIssuedToken] = useState<string | null>(null);
	const [expiresAt, setExpiresAt] = useState<string | null>(null);
	const [issueError, setIssueError] = useState<string | null>(null);
	const [revokeError, setRevokeError] = useState<string | null>(null);
	const [refundMessage, setRefundMessage] = useState<string | null>(null);
	const [refundError, setRefundError] = useState<string | null>(null);

	const handleCopy = async (value: string) => {
		await navigator.clipboard.writeText(value);
	};

	const handleIssue = async (formData: FormData) => {
		setIssueError(null);
		setIssuedToken(null);
		setExpiresAt(null);

		const scope = parseOverrideScope(String(formData.get("scope") ?? "ADMIN_ACTION"));
		const issuedToUserId = String(formData.get("issuedToUserId") ?? "");
		const expiresInMinutes = Number(formData.get("expiresInMinutes") ?? 15);

		try {
			const result = await issueTokenMutation.mutateAsync({
				scope,
				issuedToUserId: issuedToUserId ? issuedToUserId : undefined,
				expiresInMinutes,
			});

			setIssuedToken(result.token);
			setExpiresAt(result.expiresAt.toString());
		} catch (error) {
			setIssueError(
				error instanceof Error
					? error.message
					: "Unable to issue override token right now.",
			);
		}
	};

	const handleRevoke = async (formData: FormData) => {
		setRevokeError(null);
		const token = String(formData.get("token") ?? "").trim();

		if (!token) {
			setRevokeError("Provide a token to revoke.");
			return;
		}

		try {
			await revokeTokenMutation.mutateAsync({ token });
		} catch (error) {
			setRevokeError(
				error instanceof Error
					? error.message
					: "Unable to revoke token. Verify the token and try again.",
			);
		}
	};

	const handleRefund = async (formData: FormData) => {
		setRefundError(null);
		setRefundMessage(null);

		const bookingId = String(formData.get("bookingId") ?? "").trim();
		const amount = Number(formData.get("amount") ?? 0);
		const reason = String(formData.get("reason") ?? "").trim();

		if (!bookingId || amount <= 0 || reason.length < 3) {
			setRefundError("Provide booking ID, positive amount, and reason (min 3 characters).");
			return;
		}

		try {
			await approveRefundMutation.mutateAsync({
				bookingId,
				amount,
				reason,
			});
			setRefundMessage("Refund approved and audit log recorded.");
		} catch (error) {
			setRefundError(
				error instanceof Error ? error.message : "Unable to approve refund. Try again shortly.",
			);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Override &amp; Refund Controls</h1>
						<p className="text-sm text-gray-600">
							Issue elevated access tokens, revoke approvals, and record refunds with immutable auditing.
						</p>
					</div>
					<Link href="/admin/dashboard">
						<Button variant="outline" size="sm">
							Back to dashboard
						</Button>
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Issue override token</CardTitle>
							<CardDescription>
								Create a single-use override token for staff or admin escalations. Tokens automatically
								expire after 15 minutes unless specified.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form action={handleIssue} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="scope">Scope</Label>
									<select
										name="scope"
										id="scope"
										className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{overrideScopes.map((scope) => (
											<option key={scope.value} value={scope.value}>
												{scope.label}
											</option>
										))}
									</select>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="issuedToUserId">Issued to (user ID)</Label>
										<Input
											id="issuedToUserId"
											name="issuedToUserId"
											placeholder="Optional user ID"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="expiresInMinutes">Expires in (minutes)</Label>
										<Input
											id="expiresInMinutes"
											name="expiresInMinutes"
											type="number"
											min={1}
											max={60}
											defaultValue={15}
										/>
									</div>
								</div>

								{issueError ? (
									<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
										{issueError}
									</div>
								) : null}

								{issuedToken ? (
									<div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
										<div className="flex items-center justify-between gap-2">
											<span className="font-semibold">Token issued:</span>
											<Button
												variant="ghost"
												size="sm"
												type="button"
												onClick={() => handleCopy(issuedToken)}
											>
												<Copy className="mr-1 h-4 w-4" />
												Copy
											</Button>
										</div>
										<p className="mt-2 break-all font-mono text-xs">{issuedToken}</p>
										<p className="mt-2 text-xs">
											Expires at: {expiresAt ? new Date(expiresAt).toLocaleString() : "—"}
										</p>
									</div>
								) : null}

								<Button type="submit" disabled={issueTokenMutation.isPending}>
									{issueTokenMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Issuing token
										</>
									) : (
										<>
											<ShieldCheck className="mr-2 h-4 w-4" />
											Issue token
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Revoke token</CardTitle>
							<CardDescription>
								Revoke an outstanding override token. The token becomes invalid immediately.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form action={handleRevoke} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="token">Override token</Label>
									<Input id="token" name="token" placeholder="Paste token for revocation" />
								</div>

								{revokeError ? (
									<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
										{revokeError}
									</div>
								) : null}

								<Button type="submit" variant="secondary" disabled={revokeTokenMutation.isPending}>
									{revokeTokenMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Revoking
										</>
									) : (
										"Revoke token"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-6">
					<CardHeader>
						<CardTitle>Approve refund</CardTitle>
						<CardDescription>
							Record a refund event with audit logging and override tracking. Amounts are recorded for
							finance review.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={handleRefund} className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="bookingId">Booking ID</Label>
									<Input id="bookingId" name="bookingId" placeholder="cuid of booking" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="amount">Amount (USD)</Label>
									<Input id="amount" name="amount" type="number" step="0.01" min={0} placeholder="0.00" />
								</div>
								<div className="space-y-2">
									<Label>Status</Label>
									<Badge variant="outline" className="text-xs uppercase">
										Log only – Stripe handled separately
									</Badge>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="reason">Reason</Label>
								<textarea
									id="reason"
									name="reason"
									rows={4}
									className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Describe why the refund was approved. Include references to override tokens, incident numbers, or customer communications."
								/>
							</div>

							{refundError ? (
								<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
									{refundError}
								</div>
							) : null}

							{refundMessage ? (
								<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
									{refundMessage}
								</div>
							) : null}

							<Button type="submit" disabled={approveRefundMutation.isPending}>
								{approveRefundMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Recording refund
									</>
								) : (
									"Approve refund"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
