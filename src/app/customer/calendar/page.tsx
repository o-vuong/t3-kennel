"use client";

import { ArrowLeft, Calendar, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export default function CustomerCalendarPage() {
	// Mock calendar data
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	const bookings = [
		{
			id: "1",
			petName: "Buddy",
			kennelType: "Large Kennel",
			checkIn: new Date(2024, 11, 15), // December 15
			checkOut: new Date(2024, 11, 17), // December 17
			status: "Confirmed",
		},
		{
			id: "2",
			petName: "Luna",
			kennelType: "Medium Kennel",
			checkIn: new Date(2024, 11, 20), // December 20
			checkOut: new Date(2024, 11, 22), // December 22
			status: "Pending",
		},
		{
			id: "3",
			petName: "Max",
			kennelType: "Small Kennel",
			checkIn: new Date(2024, 11, 28), // December 28
			checkOut: new Date(2024, 11, 30), // December 30
			status: "Confirmed",
		},
	];

	// Generate calendar days
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

	const calendarDays = [];

	// Add empty cells for days before the first day of the month
	for (let i = 0; i < firstDayOfMonth; i++) {
		calendarDays.push(null);
	}

	// Add days of the month
	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(currentYear, currentMonth, day);
		const dayBookings = bookings.filter(
			(booking) => booking.checkIn <= date && booking.checkOut >= date,
		);
		calendarDays.push({ day, date, bookings: dayBookings });
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Confirmed":
				return "bg-green-100 text-green-800 border-green-200";
			case "Pending":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "Completed":
				return "bg-blue-100 text-blue-800 border-blue-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between py-4">
						<div className="flex items-center space-x-4">
							<Link href="/customer/home">
								<Button variant="ghost" size="sm">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Dashboard
								</Button>
							</Link>
							<div>
								<h1 className="font-bold text-2xl text-gray-900">
									Booking Calendar
								</h1>
								<p className="text-gray-600 text-sm">
									View your pet's upcoming stays
								</p>
							</div>
						</div>
						<div className="flex space-x-2">
							<Button variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								Filter
							</Button>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								New Booking
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Calendar Header */}
				<Card className="mb-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-2xl">
									{currentDate.toLocaleDateString("en-US", {
										month: "long",
										year: "numeric",
									})}
								</CardTitle>
								<CardDescription>Your pet's booking schedule</CardDescription>
							</div>
							<div className="flex space-x-2">
								<Button variant="outline" size="sm">
									Previous Month
								</Button>
								<Button variant="outline" size="sm">
									Next Month
								</Button>
							</div>
						</div>
					</CardHeader>
				</Card>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Calendar */}
					<div className="lg:col-span-2">
						<Card>
							<CardContent className="p-6">
								{/* Days of week header */}
								<div className="mb-4 grid grid-cols-7 gap-1">
									{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
										(day) => (
											<div
												key={day}
												className="py-2 text-center font-medium text-gray-500 text-sm"
											>
												{day}
											</div>
										),
									)}
								</div>

								{/* Calendar grid */}
								<div className="grid grid-cols-7 gap-1">
									{calendarDays.map((dayData, index) => (
										<div
											key={index}
											className={`min-h-[100px] border border-gray-200 p-2 text-sm ${dayData ? "bg-white" : "bg-gray-50"}
                        ${
													dayData?.date.toDateString() ===
													new Date().toDateString()
														? "border-blue-300 bg-blue-50"
														: ""
												}
                      `}
										>
											{dayData && (
												<>
													<div className="mb-2 font-medium">{dayData.day}</div>
													<div className="space-y-1">
														{dayData.bookings.map((booking) => (
															<div
																key={booking.id}
																className={`cursor-pointer rounded border p-1 text-center text-xs ${getStatusColor(booking.status)}
                                `}
															>
																{booking.petName}
															</div>
														))}
													</div>
												</>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Booking Details Sidebar */}
					<div className="space-y-6">
						{/* Upcoming Bookings */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="mr-2 h-5 w-5" />
									Upcoming Bookings
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{bookings
									.filter((b) => b.checkIn > new Date())
									.map((booking) => (
										<div key={booking.id} className="rounded-lg border p-3">
											<div className="mb-2 flex items-start justify-between">
												<div>
													<p className="font-medium">{booking.petName}</p>
													<p className="text-gray-600 text-sm">
														{booking.kennelType}
													</p>
												</div>
												<Badge className={getStatusColor(booking.status)}>
													{booking.status}
												</Badge>
											</div>
											<div className="text-gray-600 text-sm">
												<p>
													{booking.checkIn.toLocaleDateString()} -{" "}
													{booking.checkOut.toLocaleDateString()}
												</p>
											</div>
										</div>
									))}
							</CardContent>
						</Card>

						{/* Legend */}
						<Card>
							<CardHeader>
								<CardTitle>Legend</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex items-center space-x-2">
									<div className="h-3 w-3 rounded border border-green-200 bg-green-100"></div>
									<span className="text-sm">Confirmed</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="h-3 w-3 rounded border border-yellow-200 bg-yellow-100"></div>
									<span className="text-sm">Pending</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="h-3 w-3 rounded border border-blue-200 bg-blue-100"></div>
									<span className="text-sm">Completed</span>
								</div>
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Button className="w-full justify-start" variant="outline">
									<Plus className="mr-2 h-4 w-4" />
									Book New Stay
								</Button>
								<Button className="w-full justify-start" variant="outline">
									<Calendar className="mr-2 h-4 w-4" />
									View All Bookings
								</Button>
								<Button className="w-full justify-start" variant="outline">
									<Filter className="mr-2 h-4 w-4" />
									Filter Calendar
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
