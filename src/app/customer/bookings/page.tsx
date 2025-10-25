"use client";

import {
	Calendar,
	CheckCircle2,
	CreditCard,
	Loader2,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(value);

const formatDateRange = (start: Date, end: Date) =>
	`${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;

const formatStatus = (status: string) =>
	status
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const statusColor = (status: string) => {
	switch (status) {
		case "CONFIRMED":
			return "bg-emerald-100 text-emerald-800";
		case "CHECKED_IN":
			return "bg-blue-100 text-blue-800";
		case "CHECKED_OUT":
			return "bg-gray-100 text-gray-800";
		case "CANCELLED":
			return "bg-rose-100 text-rose-800";
		case "NO_SHOW":
			return "bg-amber-100 text-amber-800";
		default:
			return "bg-slate-100 text-slate-800";
	}
};

export default function CustomerBookingsPage() {
	const router = useRouter();
	const [actionError, setActionError] = useState<string | null>(null);

	const {
		data: bookings,
		isLoading,
		refetch,
	} = api.bookings.myBookings.useQuery({
		includePast: true,
	});

	const cancelBooking = api.bookings.cancel.useMutation({
		onSuccess: async () => {
			await refetch();
		},
		onError: (error) => {
			setActionError(error.message ?? "Unable to cancel booking.");
		},
	});

	const createCheckout = api.payments.createBookingCheckout.useMutation({
		onSuccess: (result) => {
			if (result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
			}
		},
		onError: (error) => {
			setActionError(
				error.message ??
					"We could not start the payment process. Please try again."
			);
		},
	});

	const upcoming = useMemo(
		() => bookings?.filter((booking) => !booking.isPast) ?? [],
		[bookings]
	);
	const past = useMemo(
		() => bookings?.filter((booking) => booking.isPast) ?? [],
		[bookings]
	);

	const handleCancel = (id: string) => {
		setActionError(null);
		const confirmed = window.confirm(
			"Cancelling this booking will release your reserved kennel. Are you sure?"
		);
		if (!confirmed) return;

		cancelBooking.mutate({ id });
	};

	const handlePay = (id: string) => {
		setActionError(null);
		createCheckout.mutate({ bookingId: id });
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div>
						<h1 className="font-bold text-2xl text-gray-900">My Bookings</h1>
						<p className="text-gray-600 text-sm">
							Track upcoming stays, review history, and manage reservations.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Link href="/customer/bookings/new">
							<Button>
								<Calendar className="mr-2 h-4 w-4" />
								New booking
							</Button>
						</Link>
						<Button variant="outline" onClick={() => router.back()}>
							Back
						</Button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{actionError ? (
					<div className="mb-6 flex items-center rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
						<ShieldAlert className="mr-2 h-4 w-4" />
						<span>{actionError}</span>
					</div>
				) : null}

				<section className="mb-10 space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-semibold text-gray-900 text-lg">
								Upcoming stays
							</h2>
							<p className="text-gray-600 text-sm">
								Confirmed and pending bookings that are still active.
							</p>
						</div>
					</div>

					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className="h-28 animate-pulse rounded-xl bg-white shadow-sm"
								/>
							))}
						</div>
					) : upcoming.length === 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>No upcoming bookings</CardTitle>
								<CardDescription>
									Reserve a kennel to see it appear in your upcoming stays.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Link href="/customer/bookings/new">
									<Button>
										<Calendar className="mr-2 h-4 w-4" />
										Book a stay
									</Button>
								</Link>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{upcoming.map((booking) => (
								<Card
									key={booking.id}
									className="flex flex-col justify-between"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="text-lg">
													{booking.pet?.name ?? "Pet booking"}
												</CardTitle>
												<CardDescription>
													{booking.kennel
														? `${booking.kennel.name} • ${booking.kennel.size.toUpperCase()}`
														: "Kennel details pending"}
												</CardDescription>
											</div>
											<Badge className={statusColor(booking.status)}>
												{formatStatus(booking.status)}
											</Badge>
										</div>
										<p className="text-gray-600 text-sm">
											{formatDateRange(
												new Date(booking.startDate),
												new Date(booking.endDate)
											)}
										</p>
									</CardHeader>
									<CardContent className="space-y-4 text-gray-600 text-sm">
										<div className="flex items-center justify-between">
											<span>Total</span>
											<span className="font-semibold text-gray-900">
												{formatCurrency(Number(booking.price))}
											</span>
										</div>
										{booking.notes ? (
											<p className="rounded-md bg-slate-100 p-3 text-slate-700 text-xs">
												<strong>Notes:</strong> {booking.notes}
											</p>
										) : null}
										<div className="flex flex-wrap items-center gap-3">
											<Button
												size="sm"
												variant="secondary"
												onClick={() => handlePay(booking.id)}
												disabled={createCheckout.isPending}
											>
												{createCheckout.isPending ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Redirecting
													</>
												) : (
													<>
														<CreditCard className="mr-2 h-4 w-4" />
														Pay deposit
													</>
												)}
											</Button>
											{booking.canCancel ? (
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleCancel(booking.id)}
													disabled={cancelBooking.isPending}
												>
													{cancelBooking.isPending ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Cancelling
														</>
													) : (
														"Cancel booking"
													)}
												</Button>
											) : null}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</section>

				<section className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-semibold text-gray-900 text-lg">
								Recent history
							</h2>
							<p className="text-gray-600 text-sm">
								Completed visits and cancelled stays for your records.
							</p>
						</div>
					</div>

					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 2 }).map((_, index) => (
								<div
									key={index}
									className="h-24 animate-pulse rounded-xl bg-white shadow-sm"
								/>
							))}
						</div>
					) : past.length === 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>You have no booking history yet</CardTitle>
								<CardDescription>
									Completed or cancelled bookings will appear here for
									reference.
								</CardDescription>
							</CardHeader>
							<CardContent className="text-gray-600 text-sm">
								Check back after your pet&apos;s first stay for detailed visit
								history.
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{past.map((booking) => (
								<Card
									key={booking.id}
									className="border border-gray-100 shadow-sm"
								>
									<CardContent className="flex items-center justify-between py-4">
										<div>
											<p className="font-medium text-gray-900 text-sm">
												{booking.pet?.name ?? "Pet booking"} —{" "}
												{booking.kennel
													? booking.kennel.size.toUpperCase()
													: "Kennel TBD"}
											</p>
											<p className="text-gray-600 text-xs">
												{formatDateRange(
													new Date(booking.startDate),
													new Date(booking.endDate)
												)}
											</p>
										</div>
										<div className="flex items-center gap-3">
											<Badge className={statusColor(booking.status)}>
												{formatStatus(booking.status)}
											</Badge>
											<span className="font-semibold text-gray-900 text-sm">
												{formatCurrency(Number(booking.price))}
											</span>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</section>

				<div className="mt-10 rounded-xl bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<CheckCircle2 className="h-6 w-6 text-emerald-600" />
							<div>
								<p className="font-semibold text-gray-900 text-sm">
									Need to update travel plans?
								</p>
								<p className="text-gray-600 text-xs">
									Contact our concierge team 24/7 at
									concierge@riviera-kennels.com or (310) 555-0111.
								</p>
							</div>
						</div>
						<Link href="/customer/home">
							<Button variant="outline" size="sm">
								Back to dashboard
							</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
