"use client";

import { ArrowLeft, Calendar, Heart, MapPin, Phone, Plus } from "lucide-react";
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

export default function CustomerPetsPage() {
	// Mock data - in production this would come from the database
	const pets = [
		{
			id: "1",
			name: "Buddy",
			breed: "Golden Retriever",
			age: 3,
			weight: 65,
			color: "Golden",
			gender: "Male",
			medicalNotes: "No known allergies. Up to date on vaccinations.",
			emergencyContact: "+1-555-0123",
			lastVisit: "2024-12-10",
			status: "Active",
			image: "/api/placeholder/200/150",
		},
		{
			id: "2",
			name: "Luna",
			breed: "Border Collie",
			age: 2,
			weight: 40,
			color: "Black & White",
			gender: "Female",
			medicalNotes: "Allergic to chicken. Requires special diet.",
			emergencyContact: "+1-555-0123",
			lastVisit: "2024-12-08",
			status: "Active",
			image: "/api/placeholder/200/150",
		},
		{
			id: "3",
			name: "Max",
			breed: "Beagle",
			age: 5,
			weight: 25,
			color: "Brown & White",
			gender: "Male",
			medicalNotes: "Arthritis in hind legs. Needs joint supplements.",
			emergencyContact: "+1-555-0123",
			lastVisit: "2024-12-05",
			status: "Active",
			image: "/api/placeholder/200/150",
		},
	];

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
								<h1 className="font-bold text-2xl text-gray-900">My Pets</h1>
								<p className="text-gray-600 text-sm">
									Manage your pet information and medical records
								</p>
							</div>
						</div>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Pet
						</Button>
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
							<div className="font-bold text-2xl">3</div>
							<p className="text-muted-foreground text-xs">
								All healthy and active
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Bookings
							</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">2</div>
							<p className="text-muted-foreground text-xs">Upcoming stays</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Last Visit</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">Dec 10</div>
							<p className="text-muted-foreground text-xs">2 days ago</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Medical Records
							</CardTitle>
							<Heart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">Up to Date</div>
							<p className="text-muted-foreground text-xs">
								All vaccinations current
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
										<CardDescription>{pet.breed}</CardDescription>
									</div>
									<Badge
										variant={pet.status === "Active" ? "default" : "secondary"}
									>
										{pet.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center space-x-4 text-sm">
									<div className="flex items-center">
										<Heart className="mr-1 h-4 w-4 text-gray-400" />
										{pet.age} years old
									</div>
									<div className="flex items-center">
										<span className="font-medium">{pet.weight} lbs</span>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Color:</span>
										<span>{pet.color}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Gender:</span>
										<span>{pet.gender}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Last Visit:</span>
										<span>{pet.lastVisit}</span>
									</div>
								</div>

								<div className="border-t pt-2">
									<p className="mb-2 text-gray-600 text-sm">Medical Notes:</p>
									<p className="text-gray-800 text-sm">{pet.medicalNotes}</p>
								</div>

								<div className="flex space-x-2 pt-2">
									<Button variant="outline" size="sm" className="flex-1">
										View Details
									</Button>
									<Button variant="outline" size="sm" className="flex-1">
										Book Stay
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Emergency Contact Info */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle className="flex items-center">
							<Phone className="mr-2 h-5 w-5" />
							Emergency Contact Information
						</CardTitle>
						<CardDescription>
							Keep your emergency contact information up to date
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<label className="font-medium text-gray-700 text-sm">
									Primary Contact
								</label>
								<div className="flex items-center space-x-2">
									<Phone className="h-4 w-4 text-gray-400" />
									<span className="text-sm">+1-555-0123</span>
								</div>
							</div>
							<div className="space-y-2">
								<label className="font-medium text-gray-700 text-sm">
									Veterinarian
								</label>
								<div className="flex items-center space-x-2">
									<Heart className="h-4 w-4 text-gray-400" />
									<span className="text-sm">Dr. Smith - City Vet Clinic</span>
								</div>
							</div>
						</div>
						<Button variant="outline" className="mt-4">
							Update Contact Information
						</Button>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
