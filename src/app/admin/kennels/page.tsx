"use client";

import {
	DollarSign,
	Edit,
	Eye,
	MapPin,
	Plus,
	Settings,
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

export default function AdminKennelsPage() {
	// Mock data for kennels
	const kennels = [
		{
			id: "1",
			name: "Small Kennel #1",
			type: "Small",
			size: "4x6 feet",
			maxWeight: 25,
			pricePerDay: 35,
			status: "Available",
			currentOccupant: null,
			features: ["Indoor", "Heated", "Daily Cleaning"],
			capacity: 1,
			location: "Building A, Floor 1",
		},
		{
			id: "2",
			name: "Medium Kennel #1",
			type: "Medium",
			size: "6x8 feet",
			maxWeight: 50,
			pricePerDay: 45,
			status: "Occupied",
			currentOccupant: "Luna (Border Collie)",
			features: ["Indoor", "Heated", "Daily Cleaning", "Play Area"],
			capacity: 1,
			location: "Building A, Floor 1",
		},
		{
			id: "3",
			name: "Large Kennel #1",
			type: "Large",
			size: "8x10 feet",
			maxWeight: 75,
			pricePerDay: 55,
			status: "Occupied",
			currentOccupant: "Buddy (Golden Retriever)",
			features: [
				"Indoor",
				"Heated",
				"Daily Cleaning",
				"Play Area",
				"Outdoor Access",
			],
			capacity: 1,
			location: "Building A, Floor 2",
		},
		{
			id: "4",
			name: "XL Kennel #1",
			type: "XL",
			size: "12x15 feet",
			maxWeight: 100,
			pricePerDay: 65,
			status: "Available",
			currentOccupant: null,
			features: [
				"Indoor",
				"Heated",
				"Daily Cleaning",
				"Play Area",
				"Outdoor Access",
				"Premium Bedding",
			],
			capacity: 2,
			location: "Building B, Floor 1",
		},
		{
			id: "5",
			name: "Small Kennel #2",
			type: "Small",
			size: "4x6 feet",
			maxWeight: 25,
			pricePerDay: 35,
			status: "Maintenance",
			currentOccupant: null,
			features: ["Indoor", "Heated", "Daily Cleaning"],
			capacity: 1,
			location: "Building A, Floor 1",
		},
		{
			id: "6",
			name: "Medium Kennel #2",
			type: "Medium",
			size: "6x8 feet",
			maxWeight: 50,
			pricePerDay: 45,
			status: "Available",
			currentOccupant: null,
			features: ["Indoor", "Heated", "Daily Cleaning", "Play Area"],
			capacity: 1,
			location: "Building A, Floor 1",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Available":
				return "bg-green-100 text-green-800";
			case "Occupied":
				return "bg-blue-100 text-blue-800";
			case "Maintenance":
				return "bg-yellow-100 text-yellow-800";
			case "Reserved":
				return "bg-purple-100 text-purple-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "Small":
				return "bg-blue-100 text-blue-800";
			case "Medium":
				return "bg-green-100 text-green-800";
			case "Large":
				return "bg-yellow-100 text-yellow-800";
			case "XL":
				return "bg-purple-100 text-purple-800";
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
								Kennel Management
							</h1>
							<p className="text-gray-600 text-sm">
								Manage kennel availability, pricing, and maintenance
							</p>
						</div>
						<div className="flex space-x-2">
							<Button variant="outline">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Kennel
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
								Total Kennels
							</CardTitle>
							<MapPin className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">24</div>
							<p className="text-muted-foreground text-xs">
								Across all buildings
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Available</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">18</div>
							<p className="text-muted-foreground text-xs">
								75% occupancy rate
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Average Price
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">$45</div>
							<p className="text-muted-foreground text-xs">Per day</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Maintenance</CardTitle>
							<Settings className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">2</div>
							<p className="text-muted-foreground text-xs">Under maintenance</p>
						</CardContent>
					</Card>
				</div>

				{/* Kennel Grid */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{kennels.map((kennel) => (
						<Card key={kennel.id} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-xl">{kennel.name}</CardTitle>
										<CardDescription>{kennel.location}</CardDescription>
									</div>
									<div className="flex space-x-2">
										<Badge className={getTypeColor(kennel.type)}>
											{kennel.type}
										</Badge>
										<Badge className={getStatusColor(kennel.status)}>
											{kennel.status}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-600">Size:</p>
										<p className="font-medium">{kennel.size}</p>
									</div>
									<div>
										<p className="text-gray-600">Max Weight:</p>
										<p className="font-medium">{kennel.maxWeight} lbs</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-600">Price:</p>
										<p className="font-bold text-lg">
											${kennel.pricePerDay}/day
										</p>
									</div>
									<div>
										<p className="text-gray-600">Capacity:</p>
										<p className="font-medium">
											{kennel.capacity} pet{kennel.capacity > 1 ? "s" : ""}
										</p>
									</div>
								</div>

								{kennel.currentOccupant && (
									<div className="border-t pt-2">
										<p className="mb-1 text-gray-600 text-sm">
											Current Occupant:
										</p>
										<p className="font-medium text-blue-600 text-sm">
											{kennel.currentOccupant}
										</p>
									</div>
								)}

								<div className="border-t pt-2">
									<p className="mb-2 text-gray-600 text-sm">Features:</p>
									<div className="flex flex-wrap gap-1">
										{kennel.features.map((feature, index) => (
											<Badge key={index} variant="outline" className="text-xs">
												{feature}
											</Badge>
										))}
									</div>
								</div>

								<div className="flex space-x-2 pt-2">
									<Button variant="outline" size="sm" className="flex-1">
										<Eye className="mr-1 h-4 w-4" />
										View
									</Button>
									<Button variant="outline" size="sm" className="flex-1">
										<Edit className="mr-1 h-4 w-4" />
										Edit
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Kennel Type Summary */}
				<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
								Small Kennels
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Total:</span>
									<span className="font-bold">8</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Available:</span>
									<span className="font-bold text-green-600">6</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Price:</span>
									<span className="font-bold">$35/day</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
								Medium Kennels
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Total:</span>
									<span className="font-bold">8</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Available:</span>
									<span className="font-bold text-green-600">5</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Price:</span>
									<span className="font-bold">$45/day</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
								Large Kennels
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Total:</span>
									<span className="font-bold">6</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Available:</span>
									<span className="font-bold text-green-600">4</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Price:</span>
									<span className="font-bold">$55/day</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-purple-500"></div>
								XL Kennels
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Total:</span>
									<span className="font-bold">2</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Available:</span>
									<span className="font-bold text-green-600">1</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Price:</span>
									<span className="font-bold">$65/day</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
