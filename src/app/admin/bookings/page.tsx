"use client";

import {
	Calendar,
	Clock,
	DollarSign,
	Edit,
	Eye,
	Filter,
	Search,
	Trash2,
	Users,
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

export default function AdminBookingsPage() {
	// Mock data for all bookings
	const bookings = [
		{
			id: "1",
			customerName: "John Customer",
			customerEmail: "customer@example.com",
			petName: "Buddy",
			petBreed: "Golden Retriever",
			kennelType: "Large Kennel",
			kennelNumber: "L-01",
			checkIn: "2024-12-15",
			checkOut: "2024-12-17",
			status: "Confirmed",
			totalCost: 110,
			depositPaid: 55,
			balanceDue: 55,
			createdAt: "2024-12-01",
			lastModified: "2024-12-01",
		},
		{
			id: "2",
			customerName: "John Customer",
			customerEmail: "customer@example.com",
			petName: "Luna",
			petBreed: "Border Collie",
			kennelType: "Medium Kennel",
			kennelNumber: "M-02",
			checkIn: "2024-12-20",
			checkOut: "2024-12-22",
			status: "Pending",
			totalCost: 90,
			depositPaid: 45,
			balanceDue: 45,
			createdAt: "2024-12-10",
			lastModified: "2024-12-10",
		},
		{
			id: "3",
			customerName: "Jane Smith",
			customerEmail: "jane@example.com",
			petName: "Max",
			petBreed: "Beagle",
			kennelType: "Small Kennel",
			kennelNumber: "S-03",
			checkIn: "2024-12-28",
			checkOut: "2024-12-30",
			status: "Confirmed",
			totalCost: 70,
			depositPaid: 35,
			balanceDue: 35,
			createdAt: "2024-12-12",
			lastModified: "2024-12-12",
		},
		{
			id: "4",
			customerName: "Bob Wilson",
			customerEmail: "bob@example.com",
			petName: "Charlie",
			petBreed: "Labrador",
			kennelType: "XL Kennel",
			kennelNumber: "XL-01",
			checkIn: "2024-12-25",
			checkOut: "2024-12-27",
			status: "Cancelled",
			totalCost: 130,
			depositPaid: 65,
			balanceDue: 0,
			createdAt: "2024-12-05",
			lastModified: "2024-12-10",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Confirmed":
				return "bg-green-100 text-green-800";
			case "Pending":
				return "bg-yellow-100 text-yellow-800";
			case "Completed":
				return "bg-blue-100 text-blue-800";
			case "Cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between py-4">
						<div>
							<h1 className="font-bold text-2xl text-gray-900">
								Booking Management
							</h1>
							<p className="text-gray-600 text-sm">
								Manage all kennel bookings and reservations
							</p>
						</div>
						<div className="flex space-x-2">
							<Button variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								Filter
							</Button>
							<Button variant="outline">
								<Search className="mr-2 h-4 w-4" />
								Search
							</Button>
							<Button>
								<Calendar className="mr-2 h-4 w-4" />
								New Booking
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Quick Stats */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Bookings
							</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">24</div>
							<p className="text-muted-foreground text-xs">This month</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Revenue</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">$2,340</div>
							<p className="text-muted-foreground text-xs">This month</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Occupancy Rate
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">87%</div>
							<p className="text-muted-foreground text-xs">Current occupancy</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Approval
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">3</div>
							<p className="text-muted-foreground text-xs">Need review</p>
						</CardContent>
					</Card>
				</div>

				{/* Booking Table */}
				<Card>
					<CardHeader>
						<CardTitle>All Bookings</CardTitle>
						<CardDescription>
							Complete list of kennel bookings and reservations
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{bookings.map((booking) => (
								<div
									key={booking.id}
									className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
								>
									<div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
										{/* Customer Info */}
										<div className="lg:col-span-3">
											<div className="flex items-center space-x-3">
												<div>
													<p className="font-medium">{booking.customerName}</p>
													<p className="text-gray-600 text-sm">
														{booking.customerEmail}
													</p>
												</div>
											</div>
										</div>

										{/* Pet Info */}
										<div className="lg:col-span-2">
											<p className="font-medium">{booking.petName}</p>
											<p className="text-gray-600 text-sm">
												{booking.petBreed}
											</p>
										</div>

										{/* Kennel Info */}
										<div className="lg:col-span-2">
											<p className="font-medium">{booking.kennelType}</p>
											<p className="text-gray-600 text-sm">
												{booking.kennelNumber}
											</p>
										</div>

										{/* Dates */}
										<div className="lg:col-span-2">
											<p className="font-medium text-sm">
												{booking.checkIn} - {booking.checkOut}
											</p>
											<p className="text-gray-600 text-sm">
												{Math.ceil(
													(new Date(booking.checkOut).getTime() -
														new Date(booking.checkIn).getTime()) /
														(1000 * 60 * 60 * 24)
												)}{" "}
												days
											</p>
										</div>

										{/* Status & Cost */}
										<div className="lg:col-span-2">
											<div className="mb-2 flex items-center justify-between">
												<Badge className={getStatusColor(booking.status)}>
													{booking.status}
												</Badge>
												<span className="font-bold">${booking.totalCost}</span>
											</div>
											<div className="text-gray-600 text-sm">
												Balance: ${booking.balanceDue}
											</div>
										</div>

										{/* Actions */}
										<div className="lg:col-span-1">
											<div className="flex space-x-1">
												<Button variant="ghost" size="sm">
													<Eye className="h-4 w-4" />
												</Button>
												<Button variant="ghost" size="sm">
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Revenue Summary */}
				<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Revenue Breakdown</CardTitle>
							<CardDescription>Monthly revenue by kennel type</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">Large Kennels</span>
									<span className="font-bold">$880</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">Medium Kennels</span>
									<span className="font-bold">$720</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">Small Kennels</span>
									<span className="font-bold">$560</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">XL Kennels</span>
									<span className="font-bold">$260</span>
								</div>
								<div className="border-t pt-2">
									<div className="flex items-center justify-between font-bold">
										<span>Total</span>
										<span>$2,420</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Booking Status</CardTitle>
							<CardDescription>
								Current booking status distribution
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<div className="h-3 w-3 rounded-full bg-green-500"></div>
										<span className="font-medium text-sm">Confirmed</span>
									</div>
									<span className="font-bold">18</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<div className="h-3 w-3 rounded-full bg-yellow-500"></div>
										<span className="font-medium text-sm">Pending</span>
									</div>
									<span className="font-bold">4</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<div className="h-3 w-3 rounded-full bg-blue-500"></div>
										<span className="font-medium text-sm">Completed</span>
									</div>
									<span className="font-bold">15</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<div className="h-3 w-3 rounded-full bg-red-500"></div>
										<span className="font-medium text-sm">Cancelled</span>
									</div>
									<span className="font-bold">2</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
