"use client";

import {
	AlertTriangle,
	Camera,
	Clock,
	FileText,
	Filter,
	Heart,
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

export default function StaffCareLogsPage() {
	// Mock data for care logs
	const careLogs = [
		{
			id: "1",
			petName: "Buddy",
			petId: "1",
			staffMember: "Sarah Johnson",
			activity: "Morning Feeding",
			timestamp: "2024-12-15 08:00",
			notes: "Ate all food enthusiastically. No issues observed.",
			status: "Completed",
			photos: ["/api/placeholder/100/100"],
			healthStatus: "Good",
			medicationGiven: null,
			nextActivity: "Exercise at 10:00 AM",
		},
		{
			id: "2",
			petName: "Luna",
			petId: "2",
			staffMember: "Mike Chen",
			activity: "Exercise Session",
			timestamp: "2024-12-15 07:30",
			notes:
				"Very energetic during play time. Loved the fetch game. No signs of stress.",
			status: "Completed",
			photos: ["/api/placeholder/100/100", "/api/placeholder/100/100"],
			healthStatus: "Good",
			medicationGiven: "Joint supplement as prescribed",
			nextActivity: "Afternoon feeding at 2:00 PM",
		},
		{
			id: "3",
			petName: "Max",
			petId: "3",
			staffMember: "Emily Rodriguez",
			activity: "Health Check",
			timestamp: "2024-12-15 06:00",
			notes:
				"Arthritis seems to be flaring up. Moving slowly. Gave prescribed pain medication.",
			status: "Completed",
			photos: ["/api/placeholder/100/100"],
			healthStatus: "Needs Attention",
			medicationGiven: "Pain medication as prescribed",
			nextActivity: "Gentle walk at 11:00 AM",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-green-100 text-green-800";
			case "In Progress":
				return "bg-blue-100 text-blue-800";
			case "Pending":
				return "bg-yellow-100 text-yellow-800";
			case "Overdue":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getHealthStatusColor = (status: string) => {
		switch (status) {
			case "Good":
				return "bg-green-100 text-green-800";
			case "Needs Attention":
				return "bg-yellow-100 text-yellow-800";
			case "Concern":
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
							<h1 className="font-bold text-2xl text-gray-900">Care Logs</h1>
							<p className="text-gray-600 text-sm">
								Track and manage pet care activities
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
								New Log Entry
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
								Today's Logs
							</CardTitle>
							<FileText className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">24</div>
							<p className="text-muted-foreground text-xs">
								Care activities logged
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Tasks
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">8</div>
							<p className="text-muted-foreground text-xs">Due soon</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Health Concerns
							</CardTitle>
							<AlertTriangle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">2</div>
							<p className="text-muted-foreground text-xs">Need attention</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Medications Given
							</CardTitle>
							<Heart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">5</div>
							<p className="text-muted-foreground text-xs">Today</p>
						</CardContent>
					</Card>
				</div>

				{/* Care Log Entries */}
				<div className="space-y-6">
					{careLogs.map((log) => (
						<Card key={log.id} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-xl">{log.petName}</CardTitle>
										<CardDescription>
											{log.activity} • {log.timestamp} • Staff:{" "}
											{log.staffMember}
										</CardDescription>
									</div>
									<div className="flex space-x-2">
										<Badge className={getStatusColor(log.status)}>
											{log.status}
										</Badge>
										<Badge className={getHealthStatusColor(log.healthStatus)}>
											{log.healthStatus}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
									<div className="space-y-4 lg:col-span-2">
										<div>
											<h4 className="mb-2 font-medium">Activity Notes:</h4>
											<p className="text-gray-700 text-sm">{log.notes}</p>
										</div>

										{log.medicationGiven && (
											<div>
												<h4 className="mb-2 font-medium">Medication Given:</h4>
												<p className="text-gray-700 text-sm">
													{log.medicationGiven}
												</p>
											</div>
										)}

										<div>
											<h4 className="mb-2 font-medium">Next Activity:</h4>
											<p className="text-blue-600 text-sm">
												{log.nextActivity}
											</p>
										</div>
									</div>

									<div className="space-y-4">
										{log.photos && log.photos.length > 0 && (
											<div>
												<h4 className="mb-2 font-medium">Photos:</h4>
												<div className="flex space-x-2">
													{log.photos.map((_photo, index) => (
														<div
															key={index}
															className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200"
														>
															<Camera className="h-6 w-6 text-gray-400" />
														</div>
													))}
												</div>
											</div>
										)}

										<div className="flex space-x-2">
											<Button variant="outline" size="sm" className="flex-1">
												<FileText className="mr-1 h-4 w-4" />
												View Details
											</Button>
											<Button variant="outline" size="sm" className="flex-1">
												<Camera className="mr-1 h-4 w-4" />
												Add Photo
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Quick Actions */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common care log activities</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<Button variant="outline" className="h-20 flex-col">
								<Heart className="mb-2 h-6 w-6" />
								<span className="text-sm">Feeding Log</span>
							</Button>
							<Button variant="outline" className="h-20 flex-col">
								<Clock className="mb-2 h-6 w-6" />
								<span className="text-sm">Exercise Log</span>
							</Button>
							<Button variant="outline" className="h-20 flex-col">
								<FileText className="mb-2 h-6 w-6" />
								<span className="text-sm">Health Check</span>
							</Button>
							<Button variant="outline" className="h-20 flex-col">
								<AlertTriangle className="mb-2 h-6 w-6" />
								<span className="text-sm">Incident Report</span>
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
