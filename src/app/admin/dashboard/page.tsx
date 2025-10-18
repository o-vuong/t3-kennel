"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	BarChart3,
	Calendar,
	DollarSign,
	Loader2,
	LogOut,
	Settings,
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

const formatCurrency = (amount: number, maximumFractionDigits = 0) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits,
	}).format(amount);

const formatPercent = (value: number) =>
	`${Math.round(value * 100)}%`;

export default function AdminDashboardPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const {
		data: overview,
		isLoading: overviewLoading,
		error: overviewError,
		refetch,
	} = api.admin.overview.useQuery(undefined, {
		refetchInterval: 60_000,
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

	const metricCards = useMemo<MetricCard[] | null>(() => {
		if (!overview) {
			return null;
		}

		return [
			{
				title: "Today’s Bookings",
				icon: Calendar,
				value: overview.metrics.todaysBookings.toLocaleString(),
				helper: "Bookings scheduled for today",
			},
			{
				title: "Active Staff",
				icon: Users,
				value: overview.metrics.activeStaff.toLocaleString(),
				helper: "Staff members currently on duty",
			},
			{
				title: "Revenue Today",
				icon: DollarSign,
				value: formatCurrency(overview.metrics.revenueToday),
				helper: "Confirmed and in-progress bookings",
			},
			{
				title: "Occupancy Rate",
				icon: BarChart3,
				value: formatPercent(overview.metrics.occupancyRate),
				helper: "Kennel utilization right now",
			},
		];
	}, [overview]);

	const revenueSeries = useMemo<RevenueEntry[]>(() => {
		if (!overview || overview.monthlyRevenue.length === 0) {
			return [];
		}

		const maxRevenue = Math.max(
			...overview.monthlyRevenue.map((entry) => entry.revenue),
			1,
		);

		return overview.monthlyRevenue.map((entry) => ({
			...entry,
			progress: Math.max(5, (entry.revenue / maxRevenue) * 100),
			formattedRevenue: formatCurrency(entry.revenue, 0),
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
						<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
						<p className="text-sm text-gray-600">
							Management and oversight for {session.user.name ?? session.user.email}
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
						<h2 className="text-lg font-semibold text-gray-900">Operational Overview</h2>
						<p className="text-sm text-gray-600">
							Live metrics refresh automatically every minute. Last updated{" "}
							{overview ? new Date().toLocaleTimeString() : "—"}.
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
						Unable to load live metrics right now. Please try again shortly.
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
									<p className="text-xs text-muted-foreground">{card.helper}</p>
								</CardContent>
							</Card>
						))
					)}
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>Monthly Revenue</CardTitle>
							<CardDescription>Revenue trends over the last six months</CardDescription>
						</CardHeader>
						<CardContent>
							{overviewLoading ? (
								<div className="space-y-4">
									{Array.from({ length: 6 }).map((_, index) => (
										<div key={index} className="h-4 w-full animate-pulse rounded bg-gray-200" />
									))}
								</div>
							) : revenueSeries.length === 0 ? (
								<p className="text-sm text-gray-600">No booking data available yet.</p>
							) : (
								<div className="space-y-4">
									{revenueSeries.map((entry) => (
										<div key={entry.id} className="flex items-center justify-between">
											<span className="text-sm font-medium">{entry.label}</span>
											<div className="flex items-center space-x-4">
												<div className="h-2 w-32 rounded-full bg-gray-200">
													<div
														className="h-2 rounded-full bg-blue-600"
														style={{ width: `${entry.progress}%` }}
													/>
												</div>
												<span className="w-20 text-right text-sm font-bold">
													{entry.formattedRevenue}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Kennel Utilization</CardTitle>
							<CardDescription>Snapshot of kennel capacity right now</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">
								{overviewLoading || !overview
									? "Loading utilization data..."
									: `Approximately ${formatPercent(
											overview.metrics.occupancyRate,
									  )} of kennels are occupied.`}
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Users className="mr-2 h-5 w-5" />
								Staff Management
							</CardTitle>
							<CardDescription>Manage staff accounts and permissions</CardDescription>
						</CardHeader>
					</Card>

					<Link href="/admin/bookings">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="mr-2 h-5 w-5" />
									Booking Management
								</CardTitle>
								<CardDescription>Monitor and manage all bookings</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/admin/kennels">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Users className="mr-2 h-5 w-5" />
									Kennel Management
								</CardTitle>
								<CardDescription>Manage kennel availability and pricing</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/admin/reports">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<DollarSign className="mr-2 h-5 w-5" />
									Reports &amp; Analytics
								</CardTitle>
								<CardDescription>View revenue and financial analytics</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<BarChart3 className="mr-2 h-5 w-5" />
								Analytics Dashboard
							</CardTitle>
							<CardDescription>View operational metrics and KPIs</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Settings className="mr-2 h-5 w-5" />
								System Settings
							</CardTitle>
							<CardDescription>Configure pricing, policies, and settings</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
		</div>
	);
}
type MetricCard = {
	title: string;
	icon: LucideIcon;
	value: string;
	helper: string;
};

type RevenueEntry = {
	id: string;
	label: string;
	revenue: number;
	bookings: number;
	progress: number;
	formattedRevenue: string;
};
