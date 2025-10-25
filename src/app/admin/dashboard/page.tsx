"use client";

import {
	CalendarCheck,
	CheckCircle2,
	CreditCard,
	DollarSign,
	Home,
	Loader2,
	Users,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { useMemo } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { useSession } from "~/lib/auth/client";
import { api } from "~/trpc/react";

const formatCurrency = (amount: number, maximumFractionDigits = 0) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits,
	}).format(amount);

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const METRIC_SKELETON_KEYS = [
	"metric-1",
	"metric-2",
	"metric-3",
	"metric-4",
] as const;

const REVENUE_SKELETON_KEYS = [
	"revenue-1",
	"revenue-2",
	"revenue-3",
	"revenue-4",
	"revenue-5",
	"revenue-6",
] as const;

const ACTIVITY_SKELETON_KEYS = [
	"activity-1",
	"activity-2",
	"activity-3",
] as const;

type DashboardStat = {
	title: string;
	value: string;
	helper: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	tint: string;
	iconColor: string;
};

type QuickAction = {
	title: string;
	description: string;
	href: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function AdminDashboardPage() {
	const { data: session, isPending: sessionPending } = useSession();

	const {
		data: overview,
		isLoading: overviewLoading,
		error: overviewError,
		refetch,
	} = api.admin.overview.useQuery(undefined, {
		refetchInterval: 60_000,
	});

	const stats = useMemo<DashboardStat[]>(() => {
		if (!overview) {
			return [];
		}

		return [
			{
				title: "Daily Revenue",
				value: formatCurrency(overview.metrics.revenueToday),
				helper: `${overview.metrics.expectedCheckIns} arrivals expected today`,
				icon: DollarSign,
				tint: "bg-emerald-50",
				iconColor: "text-emerald-600",
			},
			{
				title: "Today's Bookings",
				value: overview.metrics.todaysBookings.toLocaleString(),
				helper: `${overview.metrics.expectedCheckOuts} departures scheduled`,
				icon: CalendarCheck,
				tint: "bg-blue-50",
				iconColor: "text-blue-600",
			},
			{
				title: "Active Stays",
				value: overview.metrics.currentStays.toLocaleString(),
				helper: `${formatPercent(overview.metrics.occupancyRate)} occupancy`,
				icon: Home,
				tint: "bg-purple-50",
				iconColor: "text-purple-600",
			},
			{
				title: "Staff On Duty",
				value: overview.metrics.activeStaff.toLocaleString(),
				helper: "Including overnight coverage",
				icon: Users,
				tint: "bg-orange-50",
				iconColor: "text-orange-600",
			},
		];
	}, [overview]);

	const revenueSeries = useMemo(() => {
		if (!overview || overview.monthlyRevenue.length === 0) {
			return [];
		}

		const maxRevenue = Math.max(
			...overview.monthlyRevenue.map((entry) => entry.revenue),
			1
		);

		return overview.monthlyRevenue.map((entry) => ({
			...entry,
			progress: Math.max(6, (entry.revenue / maxRevenue) * 100),
			formattedRevenue: formatCurrency(entry.revenue, 0),
		}));
	}, [overview]);

	const quickActions: QuickAction[] = [
		{
			title: "Create booking",
			description: "Reserve a kennel or suite",
			href: "/admin/bookings",
			icon: CalendarCheck,
		},
		{
			title: "Collect payment",
			description: "Charge deposits or invoices",
			href: "/admin/reports",
			icon: CreditCard,
		},
		{
			title: "Add stay note",
			description: "Capture updates for staff",
			href: "/admin/kennels",
			icon: CheckCircle2,
		},
		{
			title: "Message owner",
			description: "Send pickup reminders",
			href: "/owner/users",
			icon: Users,
		},
	];

	const activityFeed = useMemo(() => {
		if (!overview) {
			return [];
		}

		return [
			{
				id: "checkins",
				label: `${overview.metrics.expectedCheckIns} pets checking in`,
				detail: "Arrivals slated over the next 6 hours.",
				indicator: "bg-emerald-500",
			},
			{
				id: "checkouts",
				label: `${overview.metrics.expectedCheckOuts} pets checking out`,
				detail: "Ensure balances are settled before departure.",
				indicator: "bg-blue-500",
			},
			{
				id: "occupancy",
				label: `${formatPercent(overview.metrics.occupancyRate)} occupancy`,
				detail:
					"Consider releasing overflow holds if capacity stays above 90%.",
				indicator: "bg-orange-500",
			},
		];
	}, [overview]);

	if (sessionPending || !session) {
		return (
			<div className="flex min-h-[40vh] w-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="space-y-2">
					<h1 className="font-semibold text-4xl tracking-tight">
						Welcome back, {session.user.name ?? session.user.email}
					</h1>
					<p className="text-lg text-muted-foreground">
						Monitor kennel performance, bookings, and operations in one place.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => void refetch()}
						disabled={overviewLoading}
					>
						{overviewLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Refreshing...
							</>
						) : (
							"Refresh data"
						)}
					</Button>
					<Badge variant="secondary" className="py-1">
						Live updates every 60s
					</Badge>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{overviewLoading
					? METRIC_SKELETON_KEYS.map((skeletonKey) => (
							<Card key={skeletonKey} className="border-dashed">
								<CardHeader className="space-y-2">
									<div className="h-4 w-24 animate-pulse rounded bg-muted" />
									<div className="h-7 w-20 animate-pulse rounded bg-muted/80" />
								</CardHeader>
								<CardContent className="space-y-2">
									<div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
								</CardContent>
							</Card>
						))
					: stats.map((stat) => {
							const Icon = stat.icon;
							return (
								<Card
									key={stat.title}
									className="group transition-all duration-200 hover:shadow-lg"
								>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
										<CardTitle className="font-medium text-muted-foreground text-sm">
											{stat.title}
										</CardTitle>
										<div
											className={`rounded-lg p-2 transition-colors ${stat.tint}`}
										>
											<Icon
												className={`h-5 w-5 transition-colors ${stat.iconColor}`}
											/>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="mb-1 font-bold text-3xl">{stat.value}</div>
										<p className="text-muted-foreground text-sm">
											{stat.helper}
										</p>
									</CardContent>
								</Card>
							);
						})}
			</div>

			{overviewError ? (
				<Card className="border-destructive/40 bg-destructive/5">
					<CardHeader>
						<CardTitle>Live metrics temporarily unavailable</CardTitle>
						<CardDescription>
							We were unable to refresh the latest data. Try again in a few
							minutes.
						</CardDescription>
					</CardHeader>
				</Card>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<div>
							<CardTitle className="font-semibold text-xl">
								Revenue performance
							</CardTitle>
							<CardDescription>
								Last six months of confirmed bookings
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						{overviewLoading ? (
							<div className="space-y-4">
								{REVENUE_SKELETON_KEYS.map((skeletonKey) => (
									<div
										key={skeletonKey}
										className="flex items-center gap-4 rounded-lg border border-dashed p-4"
									>
										<div className="h-4 w-24 animate-pulse rounded bg-muted" />
										<div className="flex-1">
											<div className="h-2 w-full animate-pulse rounded bg-muted/60" />
										</div>
										<div className="h-4 w-16 animate-pulse rounded bg-muted" />
									</div>
								))}
							</div>
						) : revenueSeries.length === 0 ? (
							<div className="flex min-h-[160px] items-center justify-center text-muted-foreground text-sm">
								No bookings recorded yet. Capture a booking to see revenue
								trends.
							</div>
						) : (
							<div className="space-y-4">
								{revenueSeries.map((entry) => (
									<div
										key={entry.id}
										className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-6"
									>
										<div className="flex w-full items-center justify-between gap-2 sm:w-40 sm:flex-col sm:items-start">
											<span className="font-medium text-muted-foreground text-sm">
												{entry.label}
											</span>
											<span className="font-semibold text-lg">
												{entry.formattedRevenue}
											</span>
										</div>
										<div className="flex-1">
											<div className="h-2 rounded-full bg-muted">
												<div
													className="h-2 rounded-full bg-primary transition-[width]"
													style={{ width: `${entry.progress}%` }}
												/>
											</div>
											<p className="mt-2 text-muted-foreground text-xs">
												{entry.bookings.toLocaleString()} bookings closed
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-xl">
							Operational snapshot
						</CardTitle>
						<CardDescription>
							Key highlights from the last automatic sync.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{overviewLoading || activityFeed.length === 0 ? (
							<div className="space-y-3">
								{ACTIVITY_SKELETON_KEYS.map((skeletonKey) => (
									<div
										key={skeletonKey}
										className="flex items-center gap-4 rounded-lg border border-dashed p-4"
									>
										<div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
										<div className="flex-1 space-y-2">
											<div className="h-4 w-40 animate-pulse rounded bg-muted" />
											<div className="h-3 w-full animate-pulse rounded bg-muted/70" />
										</div>
									</div>
								))}
							</div>
						) : (
							activityFeed.map((item) => (
								<div
									key={item.id}
									className="flex items-start gap-4 rounded-lg border p-4"
								>
									<div
										className={`mt-1 h-2.5 w-2.5 rounded-full ${item.indicator}`}
									/>
									<div className="flex-1">
										<p className="font-medium">{item.label}</p>
										<p className="text-muted-foreground text-sm">
											{item.detail}
										</p>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-xl">
							Quick actions
						</CardTitle>
						<CardDescription>
							Jump directly into common workflows.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2">
							{quickActions.map((action) => {
								const Icon = action.icon;
								return (
									<Link
										key={action.href}
										href={action.href}
										className="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-primary hover:bg-primary/5"
									>
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
											<Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
										</div>
										<div>
											<p className="font-semibold text-sm">{action.title}</p>
											<p className="text-muted-foreground text-sm">
												{action.description}
											</p>
										</div>
									</Link>
								);
							})}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-xl">
							Service alerts
						</CardTitle>
						<CardDescription>
							Stay on top of occupancy spikes and scheduling gaps.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border border-dashed p-4">
							<p className="font-medium text-sm">
								Peak window from 4pm to 6pm today
							</p>
							<p className="text-muted-foreground text-sm">
								Plan for staggered check-ins to avoid lobby crowding.
							</p>
						</div>
						<div className="rounded-lg border border-dashed p-4">
							<p className="font-medium text-sm">
								Two suites flagged for deep clean
							</p>
							<p className="text-muted-foreground text-sm">
								Schedule maintenance before new arrivals tomorrow morning.
							</p>
						</div>
						<div className="rounded-lg border border-dashed p-4">
							<p className="font-medium text-sm">Low stock: premium treats</p>
							<p className="text-muted-foreground text-sm">
								Auto-reorder queued for next receiving window.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
