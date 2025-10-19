"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Bell,
	Calendar,
	FileText,
	Heart,
	Loader2,
	LogOut,
	Settings,
} from "lucide-react";

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

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);

const timeAgo = (timestamp: string) => {
	const diff = Date.now() - new Date(timestamp).getTime();
	const minutes = Math.floor(diff / (1000 * 60));
	if (minutes < 60) {
		return `${minutes} min ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	}
	const days = Math.floor(hours / 24);
	return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function CustomerHomePage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const {
		data: overview,
		isLoading: overviewLoading,
		error: overviewError,
		refetch,
	} = api.customer.overview.useQuery(undefined, {
		refetchInterval: 90_000,
	});
	const {
		data: notificationsData,
		isLoading: notificationsLoading,
		refetch: refetchNotifications,
	} = api.notifications.list.useQuery({ page: 1, limit: 5 });

	const markNotificationRead = api.notifications.update.useMutation({
		onSuccess: () => {
			void refetchNotifications();
		},
	});

	const markAllNotificationsRead = api.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			void refetchNotifications();
		},
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

	const displayName = session?.user.name ?? session?.user.email ?? "Guest";

	const statCards = useMemo(() => {
		if (!overview) return null;
		return [
			{
				title: "Active Bookings",
				icon: Calendar,
				value: overview.stats.activeBookings.toString(),
				helper: overview.stats.activeBookings === 0 ? "No upcoming stays" : "Upcoming confirmed stays",
			},
			{
				title: "My Pets",
				icon: Heart,
				value: overview.stats.pets.toString(),
				helper: overview.stats.pets === 0 ? "Add your first pet" : "Ready for their stay",
			},
			{
				title: "Total Spent",
				icon: FileText,
				value: formatCurrency(overview.stats.totalSpentThisMonth),
				helper: "This month",
			},
		];
	}, [overview]);

	const notificationItems =
		(notificationsData?.items as Array<{
			id: string;
			title: string;
			message: string;
			status?: string;
		}>) ?? [];
	const unreadCount = notificationItems.filter((notification) => notification.status !== "read").length;

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
						<h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
						<p className="text-sm text-gray-600">Your personalized kennel dashboard</p>
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
						<h2 className="text-lg font-semibold text-gray-900">Booking Snapshot</h2>
						<p className="text-sm text-gray-600">
							Stay on top of your pets&apos; bookings, care updates, and payments.
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
						Unable to load your account summary. Please try again shortly.
					</div>
				) : null}

				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
					{overviewLoading || !statCards ? (
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
						statCards.map((card) => (
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

				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Link href="/customer/bookings/new">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="mr-2 h-5 w-5" />
									New Booking
								</CardTitle>
								<CardDescription>Book a kennel for your pet</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/customer/pets">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Heart className="mr-2 h-5 w-5" />
									Manage Pets
								</CardTitle>
								<CardDescription>View and update pet information</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/customer/bookings">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<FileText className="mr-2 h-5 w-5" />
									My Bookings
								</CardTitle>
								<CardDescription>View booking history and status</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/customer/calendar">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="mr-2 h-5 w-5" />
									Booking Calendar
								</CardTitle>
								<CardDescription>View your booking schedule</CardDescription>
							</CardHeader>
						</Card>
					</Link>

					<Link href="/customer/profile">
						<Card className="cursor-pointer transition-shadow hover:shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Settings className="mr-2 h-5 w-5" />
									Profile
								</CardTitle>
								<CardDescription>Update your account settings</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Your latest bookings and care updates</CardDescription>
					</CardHeader>
					<CardContent>
						{overviewLoading ? (
							<div className="space-y-3">
								{Array.from({ length: 4 }).map((_, index) => (
									<div key={index} className="h-10 w-full animate-pulse rounded bg-gray-200" />
								))}
							</div>
						) : overview && overview.recentActivity.length > 0 ? (
							<div className="space-y-4">
								{overview.recentActivity.map((activity) => (
									<div key={activity.id} className="flex items-center space-x-4">
										<span
											className={`h-2 w-2 rounded-full ${
												activity.type === "booking"
													? "bg-green-500"
													: activity.type === "care"
														? "bg-blue-500"
														: "bg-purple-500"
											}`}
										/>
										<div className="flex-1">
											<p className="text-sm font-medium">{activity.title}</p>
											<p className="text-xs text-muted-foreground">{activity.detail}</p>
										</div>
										<span className="text-xs text-muted-foreground">
											{timeAgo(activity.timestamp)}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-600">
								No recent activity yet. New updates will appear here as you make bookings and receive care
								logs.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Bell className="h-5 w-5" />
								Notifications
							</CardTitle>
							<CardDescription>
								Stay informed about payments, bookings, and important updates
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => markAllNotificationsRead.mutate()}
							disabled={markAllNotificationsRead.isPending || unreadCount === 0}
						>
							{markAllNotificationsRead.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Mark all as read"
							)}
						</Button>
					</CardHeader>
					<CardContent>
						{notificationsLoading ? (
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className="h-12 w-full animate-pulse rounded bg-gray-200" />
								))}
							</div>
						) : notificationItems.length > 0 ? (
							<div className="space-y-3">
								{notificationItems.map((notification: any) => (
									<div
										key={notification.id}
										className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3"
									>
										<div className="pr-4">
											<p className="text-sm font-semibold text-gray-900">{notification.title}</p>
											<p className="text-xs text-gray-600">{notification.message}</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												markNotificationRead.mutate({
													id: notification.id,
													data: { status: "read" },
												})
											}
											disabled={markNotificationRead.isPending || notification.status === "read"}
										>
											{notification.status === "read" ? "Read" : "Mark read"}
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-600">
								You're all caught up—no notifications right now.
							</p>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
