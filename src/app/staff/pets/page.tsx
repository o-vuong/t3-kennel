"use client";

import {
	Clock,
	FileText,
	Filter,
	Heart,
	MapPin,
	Plus,
	Search,
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

export default function StaffPetsPage() {
	// Mock data for pets currently in the kennel
	const pets = [
		{
			id: "1",
			name: "Buddy",
			breed: "Golden Retriever",
			age: 3,
			weight: 65,
			owner: "John Customer",
			kennel: "Large Kennel #1",
			checkIn: "2024-12-15",
			checkOut: "2024-12-17",
			status: "Active",
			medicalNotes: "No known allergies. Up to date on vaccinations.",
			lastCare: "2024-12-15 08:00",
			nextCare: "2024-12-15 14:00",
			image: "/api/placeholder/200/150",
		},
		{
			id: "2",
			name: "Luna",
			breed: "Border Collie",
			age: 2,
			weight: 40,
			owner: "John Customer",
			kennel: "Medium Kennel #2",
			checkIn: "2024-12-14",
			checkOut: "2024-12-16",
			status: "Active",
			medicalNotes: "Allergic to chicken. Requires special diet.",
			lastCare: "2024-12-15 07:30",
			nextCare: "2024-12-15 13:30",
			image: "/api/placeholder/200/150",
		},
		{
			id: "3",
			name: "Max",
			breed: "Beagle",
			age: 5,
			weight: 25,
			owner: "Jane Smith",
			kennel: "Small Kennel #3",
			checkIn: "2024-12-13",
			checkOut: "2024-12-15",
			status: "Checkout Today",
			medicalNotes: "Arthritis in hind legs. Needs joint supplements.",
			lastCare: "2024-12-15 06:00",
			nextCare: "2024-12-15 12:00",
			image: "/api/placeholder/200/150",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-green-100 text-green-800";
			case "Checkout Today":
				return "bg-blue-100 text-blue-800";
			case "New Arrival":
				return "bg-yellow-100 text-yellow-800";
			case "Special Care":
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
								Pet Management
							</h1>
							<p className="text-gray-600 text-sm">
								Manage all pets currently in the kennel
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
								<Plus className="mr-2 h-4 w-4" />
								Add Pet
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
							<CardTitle className="font-medium text-sm">Total Pets</CardTitle>
							<Heart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">28</div>
							<p className="text-muted-foreground text-xs">
								Currently in kennel
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Check-ins Today
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">5</div>
							<p className="text-muted-foreground text-xs">3 pending</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Check-outs Today
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">7</div>
							<p className="text-muted-foreground text-xs">2 completed</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Special Care
							</CardTitle>
							<Heart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">3</div>
							<p className="text-muted-foreground text-xs">
								Requiring attention
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Pet Cards */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{pets.map((pet) => (
						<Card key={pet.id} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-xl">{pet.name}</CardTitle>
										<CardDescription>
											{pet.breed} • {pet.age} years • {pet.weight} lbs
										</CardDescription>
									</div>
									<Badge className={getStatusColor(pet.status)}>
										{pet.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-600">Owner:</p>
										<p className="font-medium">{pet.owner}</p>
									</div>
									<div>
										<p className="text-gray-600">Kennel:</p>
										<p className="font-medium">{pet.kennel}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-600">Check-in:</p>
										<p className="font-medium">{pet.checkIn}</p>
									</div>
									<div>
										<p className="text-gray-600">Check-out:</p>
										<p className="font-medium">{pet.checkOut}</p>
									</div>
								</div>

								<div className="border-t pt-2">
									<p className="mb-1 text-gray-600 text-sm">Medical Notes:</p>
									<p className="text-gray-800 text-sm">{pet.medicalNotes}</p>
								</div>

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-600">Last Care:</p>
										<p className="font-medium">{pet.lastCare}</p>
									</div>
									<div>
										<p className="text-gray-600">Next Care:</p>
										<p className="font-medium text-blue-600">{pet.nextCare}</p>
									</div>
								</div>

								<div className="flex space-x-2 pt-2">
									<Button variant="outline" size="sm" className="flex-1">
										<FileText className="mr-1 h-4 w-4" />
										Care Log
									</Button>
									<Button variant="outline" size="sm" className="flex-1">
										<MapPin className="mr-1 h-4 w-4" />
										View Kennel
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Care Schedule */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Today's Care Schedule</CardTitle>
						<CardDescription>
							Upcoming care tasks and feeding schedules
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center space-x-4 rounded-lg bg-yellow-50 p-3">
								<Clock className="h-5 w-5 text-yellow-600" />
								<div className="flex-1">
									<p className="font-medium text-sm">
										Morning Feeding - Kennel 1
									</p>
									<p className="text-gray-600 text-xs">
										Buddy (Golden Retriever) - Due in 15 minutes
									</p>
								</div>
								<Button size="sm" variant="outline">
									Complete
								</Button>
							</div>

							<div className="flex items-center space-x-4 rounded-lg bg-blue-50 p-3">
								<Heart className="h-5 w-5 text-blue-600" />
								<div className="flex-1">
									<p className="font-medium text-sm">
										Exercise Time - Kennel 2
									</p>
									<p className="text-gray-600 text-xs">
										Luna (Border Collie) - 30 minute play session
									</p>
								</div>
								<Button size="sm" variant="outline">
									Start
								</Button>
							</div>

							<div className="flex items-center space-x-4 rounded-lg bg-green-50 p-3">
								<MapPin className="h-5 w-5 text-green-600" />
								<div className="flex-1">
									<p className="font-medium text-sm">Check-out - Kennel 3</p>
									<p className="text-gray-600 text-xs">
										Max (Beagle) - Owner arriving at 4:00 PM
									</p>
								</div>
								<Button size="sm" variant="outline">
									Prepare
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
