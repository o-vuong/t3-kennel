"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	BarChart3,
	CalendarCheck,
	CalendarX,
	DollarSign,
	Home,
	Loader2,
	LogOut,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { DEFAULT_HOME_PATH } from "~/lib/auth/roles";
import { signOut, useSession } from "~/lib/auth/client";
import { api } from "~/trpc/react";

type OwnerMetricCard = {
	title: string;
	icon: LucideIcon;
	value: string;
	helper: string;
	helperClassName?: string;
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);

const formatChange = (value: number) =>
	`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export default function OwnerControlPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const {
		data: overview,
		isLoading: overviewLoading,
		error: overviewError,
		refetch,
	} = api.owner.overview.useQuery(undefined, {
		refetchInterval: 120_000,
	});

	const handleSignOut = useCallback(async () => {
		try {
			setIsSigningOut(true);
			await signOut();
			router.replace(DEFAULT_HOME_PATH);
		} catch (error) {
			console.error("Failed to sign out", error);
		} finally {
			setIsSigningOut(false);
		}
	}, [router]);

	const metricCards = useMemo<OwnerMetricCard[] | null>(() => {
		if (!overview) {
			return null;
		}

		const systemHelper =
			overview.system.status === "healthy"
				? "Operational and within expected ranges"
				: overview.system.notes[0] ??
					(overview.system.status === "attention"
						? "Requires review"
						: "Immediate attention required");

		const helperClass =
			overview.system.status === "healthy"
				? "text-green-600"
				: overview.system.status === "attention"
					? "text-amber-600"
					: "text-red-600";

		return [
			{
				title: "Total Revenue (Month)",
				icon: DollarSign,
				value: formatCurrency(overview.revenue.total),
				helper: `${formatChange(overview.revenue.change)} vs previous month`,
				helperClassName: overview.revenue.change >= 0 ? "text-green-600" : "text-red-600",
			},
			{
				title: "Total Users",
				icon: Users,
				value: overview.users.total.toLocaleString(),
				helper: `${overview.users.newThisMonth.toLocaleString()} joined this month`,
			},
			{
				title: "System Status",
				icon: Shield,
				value: overview.system.status === "healthy" ? "Healthy" : overview.system.status === "attention" ? "Attention" : "Critical",
				helper: systemHelper,
				helperClassName: helperClass,
			},
			{
				title: "Audit Events",
				icon: BarChart3,
				value: overview.audit.last30Days.toLocaleString(),
				helper: `${overview.audit.last24Hours.toLocaleString()} in the last 24 hours`,
			},
		];
	}, [overview]);

	const operationsCards = useMemo<OwnerMetricCard[] | null>(() => {
		if (!overview) return null;

		return [
			{
				title: "Expected Check-ins",
				icon: CalendarCheck,
				value: overview.operations.expectedCheckIns.toLocaleString(),
				helper: "Arrivals scheduled for today",
			},
			{
				title: "Expected Check-outs",
				icon: CalendarX,
				value: overview.operations.expectedCheckOuts.toLocaleString(),
				helper: "Departures scheduled for today",
			},
			{
				title: "Current Stays",
				icon: Home,
				value: overview.operations.currentStays.toLocaleString(),
				helper: "Pets currently boarding",
			},
		];
	}, [overview]);

	const usersByRole = useMemo(() => {
		if (!overview) return null;
		return Object.entries(overview.users.byRole).map(([role, count]) => ({
			role,
			count,
		}));
	}, [overview]);

	if (isPending || !session) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Owner Control Panel</h1>
						<p className="text-sm text-gray-600">
							Full system access and control for {session.user.name ?? session.user.email}
						</p>
					</div>
					<Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
						<LogOut className="mr-2 h-4 w-4" />
						{isSigningOut ? "Signing Out..." : "Sign Out"}
					</Button>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Executive Snapshot</h2>
						<p className="text-sm text-gray-600">
							System overview updates every two minutes. Occupancy currently{" "}
							{overview ? formatPercent(overview.system.occupancyRate) : "—"}.
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => void refetch()}
						disabled={overviewLoading}
					>
						{overviewLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Refreshing
							</>
						) : (
							"Refresh"
						)}
					</Button>
				</div>

				{overviewError ? (
					<div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						Unable to load owner metrics right now. Please try again shortly.
					</div>
				) : null}

				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
					{overviewLoading || !metricCards ? (
						Array.from({ length: 4 }).map((_, index) => (
							<Card key={index}>
								<CardHeader className="space-y-1 pb-2">
									<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
									<div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
								</CardHeader>
								<CardContent>
									<div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
								</CardContent>
							</Card>
						))
					) : (
						metricCards.map((card) => (
							<Card key={card.title}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">{card.title}</CardTitle>
									<card.icon className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{card.value}</div>
									<p className={`text-xs ${card.helperClassName ?? "text-muted-foreground"}`}>
										{card.helper}
									</p>
								</CardContent>
							</Card>
						))
					)}
				</div>

				<section className="mb-8">
					<h3 className="mb-3 text-lg font-semibold text-gray-900">Today’s Operations</h3>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{overviewLoading || !operationsCards ? (
							Array.from({ length: 3 }).map((_, index) => (
								<Card key={index}>
									<CardHeader className="space-y-1 pb-2">
										<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
										<div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
									</CardHeader>
									<CardContent>
										<div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
									</CardContent>
								</Card>
							))
						) : (
							operationsCards.map((card) => (
								<Card key={card.title}>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">{card.title}</CardTitle>
										<card.icon className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">{card.value}</div>
										<p className="text-xs text-muted-foreground">{card.helper}</p>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</section>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>User Distribution</CardTitle>
							<CardDescription>Breakdown of active users by role</CardDescription>
						</CardHeader>
						<CardContent>
							{overviewLoading || !usersByRole ? (
								<div className="space-y-3">
									{Array.from({ length: 4 }).map((_, index) => (
										<div key={index} className="h-4 w-full animate-pulse rounded bg-gray-200" />
									))}
								</div>
							) : (
								<div className="space-y-3">
									{usersByRole.map((entry) => (
										<div key={entry.role} className="flex items-center justify-between">
											<span className="text-sm font-medium capitalize">
												{entry.role.toLowerCase()}
											</span>
											<span className="text-sm text-gray-600">
												{entry.count.toLocaleString()}
											</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Open Alerts</CardTitle>
							<CardDescription>Recent signals and operational notes</CardDescription>
						</CardHeader>
						<CardContent>
							{overviewLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, index) => (
										<div key={index} className="h-4 w-full animate-pulse rounded bg-gray-200" />
									))}
								</div>
							) : overview && overview.system.notes.length > 0 ? (
								<ul className="space-y-2 text-sm text-amber-700">
									{overview.system.notes.map((note, index) => (
										<li key={index}>{note}</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-gray-600">No outstanding alerts. All systems normal.</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Link href="/owner/users">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Users className="mr-2 h-5 w-5" />
									User Management
								</CardTitle>
								<CardDescription>Manage all users and roles</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/owner/system">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Settings className="mr-2 h-5 w-5" />
									System Configuration
								</CardTitle>
								<CardDescription>Configure system settings and policies</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Shield className="mr-2 h-5 w-5" />
								Security &amp; Compliance
							</CardTitle>
							<CardDescription>Monitor security and HIPAA compliance</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<BarChart3 className="mr-2 h-5 w-5" />
								Analytics &amp; Reports
							</CardTitle>
							<CardDescription>View system analytics and generate reports</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<DollarSign className="mr-2 h-5 w-5" />
								Financial Management
							</CardTitle>
							<CardDescription>Manage pricing, payments, and financial data</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Settings className="mr-2 h-5 w-5" />
								Database Management
							</CardTitle>
							<CardDescription>Backup, restore, and maintain database</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
		</div>
	);
}
