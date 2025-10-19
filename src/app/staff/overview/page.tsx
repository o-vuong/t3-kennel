"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Calendar,
	CalendarCheck,
	CalendarX,
	CheckCircle,
	Clock,
	FileText,
	Heart,
	Loader2,
	LogOut,
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

type StaffMetricCard = {
	title: string;
	icon: LucideIcon;
	value: string;
	helper: string;
};

const formatTime = (isoString: string) =>
	new Date(isoString).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});

export default function StaffOverviewPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const {
		data: overview,
		isLoading: overviewLoading,
		error: overviewError,
		refetch,
	} = api.staff.overview.useQuery(undefined, {
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

	const metricCards = useMemo<StaffMetricCard[] | null>(() => {
		if (!overview) return null;

		return [
			{
				title: "Expected Check-ins",
				icon: CalendarCheck,
				value: overview.metrics.expectedCheckIns.toString(),
				helper: `${overview.metrics.pendingCheckIns} awaiting arrival`,
			},
			{
				title: "Expected Check-outs",
				icon: CalendarX,
				value: overview.metrics.expectedCheckOuts.toString(),
				helper: `${overview.metrics.completedCheckOuts} already cleared`,
			},
			{
				title: "Current Stays",
				icon: Heart,
				value: overview.metrics.currentStays.toString(),
				helper: "Pets currently boarding",
			},
			{
				title: "Care Logs Recorded",
				icon: Clock,
				value: overview.metrics.careLogsToday.toString(),
				helper: "Entries logged today",
			},
		];
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
						<h1 className="text-2xl font-bold text-gray-900">Staff Overview</h1>
						<p className="text-sm text-gray-600">
							Daily operations and pet care — {session.user.name ?? session.user.email}
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
						<h2 className="text-lg font-semibold text-gray-900">Operations Dashboard</h2>
						<p className="text-sm text-gray-600">
							Live kennel activity for today&apos;s shift. Refresh to sync with the latest check-ins.
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
						Unable to load staff metrics right now. Please try again shortly.
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

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Link href="/staff/pets">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<CheckCircle className="mr-2 h-5 w-5" />
									Manage Pets
								</CardTitle>
								<CardDescription>Process check-ins and manage pet care</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/staff/care-logs">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Heart className="mr-2 h-5 w-5" />
									Care Logs
								</CardTitle>
								<CardDescription>Update feeding, exercise, and care activities</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/staff/bookings">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="mr-2 h-5 w-5" />
									Manage Bookings
								</CardTitle>
								<CardDescription>Create and manage pet bookings</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Clock className="mr-2 h-5 w-5" />
								Daily Schedule
							</CardTitle>
							<CardDescription>View and manage daily care schedule</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<FileText className="mr-2 h-5 w-5" />
								Care Reports
							</CardTitle>
							<CardDescription>Generate care reports for customers</CardDescription>
						</CardHeader>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Heart className="mr-2 h-5 w-5" />
								Pet Health Monitoring
							</CardTitle>
							<CardDescription>Monitor pet health and report issues</CardDescription>
						</CardHeader>
					</Card>
				</div>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Today&apos;s Care Schedule</CardTitle>
						<CardDescription>Upcoming care tasks and appointments</CardDescription>
					</CardHeader>
					<CardContent>
						{overviewLoading ? (
							<div className="space-y-3">
								{Array.from({ length: 4 }).map((_, index) => (
									<div key={index} className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
								))}
							</div>
						) : overview && overview.schedule.length > 0 ? (
							<div className="space-y-4">
								{overview.schedule.map((item) => (
									<div
										key={item.id}
										className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-3"
									>
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
											{item.category === "care" ? (
												<Heart className="h-4 w-4" />
											) : item.category === "check-in" ? (
												<CheckCircle className="h-4 w-4" />
											) : (
												<Calendar className="h-4 w-4" />
											)}
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-gray-900">{item.title}</p>
											<p className="text-xs text-gray-600">{item.detail}</p>
										</div>
										<div className="text-xs font-medium text-gray-700">
											{formatTime(item.dueAt)}
										</div>
										<Button size="sm" variant="outline">
											{item.category === "check-in"
												? "Check in"
												: item.category === "check-out"
													? "Prepare"
													: "Log"}
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-600">
								No remaining tasks for today. Great work keeping the schedule on track!
							</p>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
