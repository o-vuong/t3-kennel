"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
	BadgeCheck,
	CalendarCheck,
	CalendarClock,
	Loader2,
	Tag,
} from "lucide-react";

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

const formatStatus = (status: string) =>
	status
		.toLowerCase()
		.split("_")
		.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
		.join(" ");

const formatDateTime = (value: Date) =>
	new Date(value).toLocaleString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});

export default function StaffBookingsPage() {
	const [tokens, setTokens] = useState<Record<string, string>>({});
	const [notes, setNotes] = useState<Record<string, string>>({});
	const [actionError, setActionError] = useState<string | null>(null);

	const {
		data,
		isLoading,
		refetch,
		isRefetching,
	} = api.bookings.staffSchedule.useQuery({});

	const checkInMutation = api.bookings.checkIn.useMutation({
		onSuccess: async () => {
			setActionError(null);
			await refetch();
		},
		onError: (error) => {
			setActionError(error.message ?? "Unable to check in booking.");
		},
	});

	const checkOutMutation = api.bookings.checkOut.useMutation({
		onSuccess: async () => {
			setActionError(null);
			await refetch();
		},
		onError: (error) => {
			setActionError(error.message ?? "Unable to check out booking.");
		},
	});

	const bookings = useMemo(() => data?.bookings ?? [], [data]);

	const handleTokenChange = (bookingId: string, value: string) =>
		setTokens((prev) => ({ ...prev, [bookingId]: value }));

	const handleNoteChange = (bookingId: string, value: string) =>
		setNotes((prev) => ({ ...prev, [bookingId]: value }));

	const handleCheckIn = (bookingId: string) => {
		setActionError(null);
		checkInMutation.mutate({
			id: bookingId,
			overrideToken: tokens[bookingId] || undefined,
			note: notes[bookingId] ? notes[bookingId].trim() : undefined,
		});
	};

	const handleCheckOut = (bookingId: string) => {
		setActionError(null);
		checkOutMutation.mutate({
			id: bookingId,
			overrideToken: tokens[bookingId] || undefined,
			note: notes[bookingId] ? notes[bookingId].trim() : undefined,
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Booking Operations</h1>
						<p className="text-sm text-gray-600">
							Manage today&apos;s arrivals, departures, and kennel assignments.
						</p>
					</div>
					<Link href="/staff/overview">
						<Button variant="outline" size="sm">
							Back to overview
						</Button>
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Today&apos;s schedule</h2>
						<p className="text-sm text-gray-600">
							Check-ins, in-progress stays, and guests scheduled for departure.
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => void refetch()}
						disabled={isRefetching || isLoading}
					>
						{isRefetching || isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Refreshing
							</>
						) : (
							"Refresh"
						)}
					</Button>
				</div>

				{actionError ? (
					<div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
						{actionError}
					</div>
				) : null}

				{data?.overrideRequired ? (
					<div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
						Staff updates require a valid override token. Request one from an administrator if you
						don&apos;t already have it.
					</div>
				) : null}

				{isLoading ? (
					<div className="space-y-4">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="h-28 animate-pulse rounded-xl bg-white shadow-sm" />
						))}
					</div>
				) : bookings.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>No bookings scheduled for today</CardTitle>
							<CardDescription>New reservations will appear here automatically.</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{bookings.map((booking) => (
							<Card key={booking.id} className="border border-gray-100 shadow-sm">
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="text-lg">
												{booking.pet?.name ?? "Pet booking"}
											</CardTitle>
											<CardDescription className="flex flex-col text-xs text-gray-600">
												<span>
													Arrival: {formatDateTime(new Date(booking.startDate))}
												</span>
												<span>
													Departure: {formatDateTime(new Date(booking.endDate))}
												</span>
											</CardDescription>
										</div>
										<Badge className="bg-slate-100 text-slate-800">
											{booking.kennel?.name ?? "Kennel TBD"}
										</Badge>
									</div>
									<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
										<Badge className="bg-blue-50 text-blue-700">
											<Tag className="mr-1 h-3 w-3" />
											{formatStatus(booking.status)}
										</Badge>
										{booking.customer?.name ? <span>Client: {booking.customer.name}</span> : null}
										{booking.customer?.email ? (
											<span className="truncate">Email: {booking.customer.email}</span>
										) : null}
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 gap-4">
										{data?.overrideRequired ? (
											<div className="space-y-1">
												<Label htmlFor={`token-${booking.id}`} className="text-xs uppercase text-gray-500">
													Override token
												</Label>
												<Input
													id={`token-${booking.id}`}
													placeholder="Enter override token"
													value={tokens[booking.id] ?? ""}
													onChange={(event) => handleTokenChange(booking.id, event.target.value)}
													className="text-sm"
												/>
											</div>
										) : null}

										<div className="space-y-1">
											<Label htmlFor={`note-${booking.id}`} className="text-xs uppercase text-gray-500">
												Care note (optional)
											</Label>
											<textarea
												id={`note-${booking.id}`}
												className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
												rows={2}
												placeholder="Add check-in notes or departures instructions"
												value={notes[booking.id] ?? ""}
												onChange={(event) => handleNoteChange(booking.id, event.target.value)}
											/>
										</div>
									</div>

									<div className="flex flex-wrap items-center gap-2">
										<Button
											size="sm"
											variant="secondary"
											onClick={() => handleCheckIn(booking.id)}
											disabled={
												!booking.canCheckIn ||
												checkInMutation.isPending ||
												checkOutMutation.isPending
											}
										>
											{checkInMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Checking in
												</>
											) : (
												<>
													<CalendarCheck className="mr-2 h-4 w-4" />
													Check in
												</>
											)}
										</Button>

										<Button
											size="sm"
											variant="outline"
											onClick={() => handleCheckOut(booking.id)}
											disabled={
												!booking.canCheckOut ||
												checkInMutation.isPending ||
												checkOutMutation.isPending
											}
										>
											{checkOutMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Checking out
												</>
											) : (
												<>
													<CalendarClock className="mr-2 h-4 w-4" />
													Check out
												</>
											)}
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				<div className="mt-10 rounded-xl bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3 text-sm text-gray-700">
							<BadgeCheck className="h-5 w-5 text-emerald-600" />
							<span>
								Log every hand-off and update. Accurate audit trails protect staff and ensure owners are
								notified instantly.
							</span>
						</div>
						<Link href="/admin/overrides">
							<Button variant="link" size="sm">
								Request new override token
							</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
