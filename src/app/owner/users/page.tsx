"use client";

import { ArrowLeft, Edit, Plus, Shield, Trash2, Users } from "lucide-react";
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

export default function OwnerUsersPage() {
	// Mock user data
	const users = [
		{
			id: "1",
			name: "Kennel Owner",
			email: "owner@kennel.com",
			role: "OWNER",
			status: "Active",
			lastLogin: "2024-12-15 10:30",
			createdAt: "2024-01-01",
		},
		{
			id: "2",
			name: "Kennel Admin",
			email: "admin@kennel.com",
			role: "ADMIN",
			status: "Active",
			lastLogin: "2024-12-15 09:15",
			createdAt: "2024-01-15",
		},
		{
			id: "3",
			name: "Kennel Staff",
			email: "staff@kennel.com",
			role: "STAFF",
			status: "Active",
			lastLogin: "2024-12-15 08:45",
			createdAt: "2024-02-01",
		},
		{
			id: "4",
			name: "John Customer",
			email: "customer@example.com",
			role: "CUSTOMER",
			status: "Active",
			lastLogin: "2024-12-14 16:20",
			createdAt: "2024-03-10",
		},
	];

	const getRoleColor = (role: string) => {
		switch (role) {
			case "OWNER":
				return "bg-purple-100 text-purple-800";
			case "ADMIN":
				return "bg-blue-100 text-blue-800";
			case "STAFF":
				return "bg-green-100 text-green-800";
			case "CUSTOMER":
				return "bg-gray-100 text-gray-800";
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
						<div className="flex items-center space-x-4">
							<Link href="/owner/control">
								<Button variant="ghost" size="sm">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Control Panel
								</Button>
							</Link>
							<div>
								<h1 className="font-bold text-2xl text-gray-900">
									User Management
								</h1>
								<p className="text-gray-600 text-sm">
									Manage all users and roles
								</p>
							</div>
						</div>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add User
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
							<CardTitle className="font-medium text-sm">Total Users</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">124</div>
							<p className="text-muted-foreground text-xs">+12 this month</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Users
							</CardTitle>
							<Shield className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">118</div>
							<p className="text-muted-foreground text-xs">95% active rate</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Staff Members
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">8</div>
							<p className="text-muted-foreground text-xs">All active</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Customers</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">115</div>
							<p className="text-muted-foreground text-xs">
								+10 new this month
							</p>
						</CardContent>
					</Card>
				</div>

				{/* User Table */}
				<Card>
					<CardHeader>
						<CardTitle>All Users</CardTitle>
						<CardDescription>
							Complete list of system users with role management
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{users.map((user) => (
								<div
									key={user.id}
									className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
								>
									<div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
										{/* User Info */}
										<div className="lg:col-span-3">
											<div className="flex items-center space-x-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
													<Users className="h-5 w-5 text-blue-600" />
												</div>
												<div>
													<p className="font-medium">{user.name}</p>
													<p className="text-gray-600 text-sm">{user.email}</p>
												</div>
											</div>
										</div>

										{/* Role */}
										<div className="lg:col-span-2">
											<Badge className={getRoleColor(user.role)}>
												{user.role}
											</Badge>
										</div>

										{/* Status */}
										<div className="lg:col-span-2">
											<div className="flex items-center">
												<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
												<span className="font-medium text-sm">
													{user.status}
												</span>
											</div>
										</div>

										{/* Last Login */}
										<div className="lg:col-span-2">
											<p className="text-gray-600 text-sm">{user.lastLogin}</p>
										</div>

										{/* Created Date */}
										<div className="lg:col-span-2">
											<p className="text-gray-600 text-sm">{user.createdAt}</p>
										</div>

										{/* Actions */}
										<div className="lg:col-span-1">
											<div className="flex space-x-1">
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

				{/* Role Permissions */}
				<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-purple-500"></div>
								Owner
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Users:</span>
									<span className="font-bold">1</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Permissions:</span>
									<span className="font-bold">Full Access</span>
								</div>
								<ul className="space-y-1 text-gray-600 text-xs">
									<li>• System configuration</li>
									<li>• User management</li>
									<li>• Financial access</li>
									<li>• Security controls</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
								Admin
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Users:</span>
									<span className="font-bold">1</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Permissions:</span>
									<span className="font-bold">Management</span>
								</div>
								<ul className="space-y-1 text-gray-600 text-xs">
									<li>• Staff management</li>
									<li>• Booking oversight</li>
									<li>• Financial reports</li>
									<li>• Customer support</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
								Staff
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Users:</span>
									<span className="font-bold">8</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Permissions:</span>
									<span className="font-bold">Operations</span>
								</div>
								<ul className="space-y-1 text-gray-600 text-xs">
									<li>• Pet care management</li>
									<li>• Check-in/out</li>
									<li>• Care logs</li>
									<li>• Daily operations</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<div className="mr-2 h-3 w-3 rounded-full bg-gray-500"></div>
								Customer
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm">Users:</span>
									<span className="font-bold">115</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Permissions:</span>
									<span className="font-bold">Self-Service</span>
								</div>
								<ul className="space-y-1 text-gray-600 text-xs">
									<li>• Pet management</li>
									<li>• Booking creation</li>
									<li>• View care logs</li>
									<li>• Payment processing</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
