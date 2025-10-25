"use client";

import {
	BarChart3,
	Calendar,
	DollarSign,
	Download,
	Filter,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export default function AdminReportsPage() {
	// Mock data for reports
	const monthlyRevenue = [
		{ month: "Jan", revenue: 3200, bookings: 45 },
		{ month: "Feb", revenue: 2800, bookings: 38 },
		{ month: "Mar", revenue: 3500, bookings: 52 },
		{ month: "Apr", revenue: 4200, bookings: 61 },
		{ month: "May", revenue: 3800, bookings: 55 },
		{ month: "Jun", revenue: 4500, bookings: 68 },
		{ month: "Jul", revenue: 5200, bookings: 78 },
		{ month: "Aug", revenue: 4800, bookings: 72 },
		{ month: "Sep", revenue: 4100, bookings: 59 },
		{ month: "Oct", revenue: 4600, bookings: 67 },
		{ month: "Nov", revenue: 3900, bookings: 56 },
		{ month: "Dec", revenue: 5400, bookings: 82 },
	];

	const kennelUtilization = [
		{ type: "Small", total: 8, occupied: 6, utilization: 75 },
		{ type: "Medium", total: 8, occupied: 7, utilization: 87.5 },
		{ type: "Large", total: 6, occupied: 4, utilization: 66.7 },
		{ type: "XL", total: 2, occupied: 1, utilization: 50 },
	];

	const topCustomers = [
		{
			name: "John Customer",
			email: "customer@example.com",
			bookings: 8,
			totalSpent: 720,
		},
		{
			name: "Jane Smith",
			email: "jane@example.com",
			bookings: 6,
			totalSpent: 540,
		},
		{
			name: "Bob Wilson",
			email: "bob@example.com",
			bookings: 5,
			totalSpent: 450,
		},
		{
			name: "Sarah Johnson",
			email: "sarah@example.com",
			bookings: 4,
			totalSpent: 360,
		},
		{
			name: "Mike Chen",
			email: "mike@example.com",
			bookings: 3,
			totalSpent: 270,
		},
	];

	const hasHistoricalData = monthlyRevenue.length >= 2;
	const currentMonth = hasHistoricalData
		? monthlyRevenue[monthlyRevenue.length - 1]
		: null;
	const previousMonth = hasHistoricalData
		? monthlyRevenue[monthlyRevenue.length - 2]
		: null;
	const revenueGrowth =
		previousMonth && currentMonth
			? (
					((currentMonth.revenue - previousMonth.revenue) /
						previousMonth.revenue) *
					100
				).toFixed(1)
			: "0.0";
	const bookingGrowth =
		previousMonth && currentMonth
			? (
					((currentMonth.bookings - previousMonth.bookings) /
						previousMonth.bookings) *
					100
				).toFixed(1)
			: "0.0";
	const currentRevenue = currentMonth?.revenue ?? 0;
	const currentBookingCount = currentMonth?.bookings ?? 0;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between py-4">
						<div>
							<h1 className="font-bold text-2xl text-gray-900">
								Reports & Analytics
							</h1>
							<p className="text-gray-600 text-sm">
								Business insights and performance metrics
							</p>
						</div>
						<div className="flex space-x-2">
							<Button variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								Filter
							</Button>
							<Button>
								<Download className="mr-2 h-4 w-4" />
								Export Report
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Key Metrics */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Monthly Revenue
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${currentRevenue.toLocaleString()}
							</div>
							<div className="flex items-center text-muted-foreground text-xs">
								{Number.parseFloat(revenueGrowth) > 0 ? (
									<TrendingUp className="mr-1 h-3 w-3 text-green-500" />
								) : (
									<TrendingDown className="mr-1 h-3 w-3 text-red-500" />
								)}
								<span
									className={
										Number.parseFloat(revenueGrowth) > 0
											? "text-green-500"
											: "text-red-500"
									}
								>
									{revenueGrowth}% from last month
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Bookings
							</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{currentBookingCount}</div>
							<div className="flex items-center text-muted-foreground text-xs">
								{Number.parseFloat(bookingGrowth) > 0 ? (
									<TrendingUp className="mr-1 h-3 w-3 text-green-500" />
								) : (
									<TrendingDown className="mr-1 h-3 w-3 text-red-500" />
								)}
								<span
									className={
										Number.parseFloat(bookingGrowth) > 0
											? "text-green-500"
											: "text-red-500"
									}
								>
									{bookingGrowth}% from last month
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Customers
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">124</div>
							<p className="text-muted-foreground text-xs">
								+12 new this month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Occupancy Rate
							</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">78%</div>
							<p className="text-muted-foreground text-xs">Above average</p>
						</CardContent>
					</Card>
				</div>

				<div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Revenue Chart */}
					<Card>
						<CardHeader>
							<CardTitle>Monthly Revenue</CardTitle>
							<CardDescription>
								Revenue trends over the past 12 months
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{monthlyRevenue.slice(-6).map((data, _index) => (
									<div
										key={data.month}
										className="flex items-center justify-between"
									>
										<span className="font-medium text-sm">{data.month}</span>
										<div className="flex items-center space-x-4">
											<div className="h-2 w-32 rounded-full bg-gray-200">
												<div
													className="h-2 rounded-full bg-blue-600"
													style={{ width: `${(data.revenue / 6000) * 100}%` }}
												></div>
											</div>
											<span className="w-16 text-right font-bold text-sm">
												${data.revenue.toLocaleString()}
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Kennel Utilization */}
					<Card>
						<CardHeader>
							<CardTitle>Kennel Utilization</CardTitle>
							<CardDescription>
								Current utilization by kennel type
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{kennelUtilization.map((kennel) => (
									<div key={kennel.type} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-medium text-sm">
												{kennel.type} Kennels
											</span>
											<span className="text-gray-600 text-sm">
												{kennel.occupied}/{kennel.total}
											</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className={`h-2 rounded-full ${
													kennel.utilization >= 80
														? "bg-green-500"
														: kennel.utilization >= 60
															? "bg-yellow-500"
															: "bg-red-500"
												}`}
												style={{ width: `${kennel.utilization}%` }}
											></div>
										</div>
										<div className="flex justify-between text-gray-600 text-xs">
											<span>{kennel.utilization}% utilized</span>
											<span>{kennel.total - kennel.occupied} available</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Top Customers */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Top Customers</CardTitle>
						<CardDescription>
							Customers with the most bookings and highest spending
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{topCustomers.map((customer, index) => (
								<div
									key={customer.email}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center space-x-4">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
											<span className="font-bold text-blue-600 text-sm">
												{index + 1}
											</span>
										</div>
										<div>
											<p className="font-medium">{customer.name}</p>
											<p className="text-gray-600 text-sm">{customer.email}</p>
										</div>
									</div>
									<div className="flex items-center space-x-6">
										<div className="text-right">
											<p className="text-gray-600 text-sm">Bookings</p>
											<p className="font-bold">{customer.bookings}</p>
										</div>
										<div className="text-right">
											<p className="text-gray-600 text-sm">Total Spent</p>
											<p className="font-bold">${customer.totalSpent}</p>
										</div>
										<Button variant="outline" size="sm">
											View Details
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Quick Reports */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<DollarSign className="mr-2 h-5 w-5" />
								Financial Report
							</CardTitle>
							<CardDescription>
								Detailed revenue and expense analysis
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button className="w-full" variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Generate Report
							</Button>
						</CardContent>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Calendar className="mr-2 h-5 w-5" />
								Booking Report
							</CardTitle>
							<CardDescription>
								Booking trends and occupancy analysis
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button className="w-full" variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Generate Report
							</Button>
						</CardContent>
					</Card>

					<Card className="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Users className="mr-2 h-5 w-5" />
								Customer Report
							</CardTitle>
							<CardDescription>
								Customer satisfaction and retention metrics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button className="w-full" variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Generate Report
							</Button>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
