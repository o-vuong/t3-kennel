"use client";

import {
	ArrowLeft,
	Bell,
	Database,
	DollarSign,
	Globe,
	Lock,
	Settings,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export default function OwnerSystemPage() {
	const handleSave = () => {
		alert("System settings saved successfully!");
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
									System Configuration
								</h1>
								<p className="text-gray-600 text-sm">
									Configure system settings and policies
								</p>
							</div>
						</div>
						<Button onClick={handleSave}>
							<Settings className="mr-2 h-4 w-4" />
							Save Changes
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Settings Forms */}
					<div className="space-y-6 lg:col-span-2">
						{/* General Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Globe className="mr-2 h-5 w-5" />
									General Settings
								</CardTitle>
								<CardDescription>
									Basic system configuration and branding
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">Business Name</label>
										<input
											type="text"
											defaultValue="Premium Kennel Services"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">Contact Email</label>
										<input
											type="email"
											defaultValue="info@kennel.com"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">Phone Number</label>
										<input
											type="tel"
											defaultValue="+1-555-0123"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">Address</label>
										<input
											type="text"
											defaultValue="123 Pet Lane, City, State 12345"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Pricing Configuration */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<DollarSign className="mr-2 h-5 w-5" />
									Pricing Configuration
								</CardTitle>
								<CardDescription>
									Set kennel rates and pricing policies
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Small Kennel Rate
										</label>
										<input
											type="number"
											defaultValue="35"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Medium Kennel Rate
										</label>
										<input
											type="number"
											defaultValue="45"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Large Kennel Rate
										</label>
										<input
											type="number"
											defaultValue="55"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">
											XL Kennel Rate
										</label>
										<input
											type="number"
											defaultValue="65"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Deposit Percentage
										</label>
										<input
											type="number"
											defaultValue="50"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Cancellation Fee
										</label>
										<input
											type="number"
											defaultValue="25"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Security Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Shield className="mr-2 h-5 w-5" />
									Security Settings
								</CardTitle>
								<CardDescription>
									Configure security policies and compliance
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Session Timeout (minutes)
										</label>
										<input
											type="number"
											defaultValue="30"
											className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Password Policy
										</label>
										<select className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
											<option>Strong (8+ chars, mixed case, numbers)</option>
											<option>Medium (6+ chars)</option>
											<option>Basic (4+ chars)</option>
										</select>
									</div>
								</div>
								<div className="space-y-4">
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="mfa"
											defaultChecked
											className="rounded"
										/>
										<label htmlFor="mfa" className="font-medium text-sm">
											Enable Multi-Factor Authentication
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="audit"
											defaultChecked
											className="rounded"
										/>
										<label htmlFor="audit" className="font-medium text-sm">
											Enable Audit Logging
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="hipaa"
											defaultChecked
											className="rounded"
										/>
										<label htmlFor="hipaa" className="font-medium text-sm">
											HIPAA Compliance Mode
										</label>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* System Status Sidebar */}
					<div className="space-y-6">
						{/* System Health */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Database className="mr-2 h-5 w-5" />
									System Health
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Database</span>
										<div className="flex items-center">
											<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
											<span className="text-green-600 text-sm">Healthy</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">API Services</span>
										<div className="flex items-center">
											<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
											<span className="text-green-600 text-sm">Online</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">File Storage</span>
										<div className="flex items-center">
											<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
											<span className="text-green-600 text-sm">Available</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Email Service</span>
										<div className="flex items-center">
											<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
											<span className="text-green-600 text-sm">Connected</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* System Information */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Settings className="mr-2 h-5 w-5" />
									System Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Version:</span>
									<span className="font-medium">v2.1.0</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Last Updated:</span>
									<span className="font-medium">Dec 15, 2024</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Database Size:</span>
									<span className="font-medium">245 MB</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Users:</span>
									<span className="font-medium">124</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Uptime:</span>
									<span className="font-medium">99.9%</span>
								</div>
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Button variant="outline" className="w-full justify-start">
									<Database className="mr-2 h-4 w-4" />
									Database Backup
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Bell className="mr-2 h-4 w-4" />
									Test Notifications
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Lock className="mr-2 h-4 w-4" />
									Security Scan
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Settings className="mr-2 h-4 w-4" />
									System Maintenance
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
