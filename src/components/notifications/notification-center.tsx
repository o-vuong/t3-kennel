"use client";

import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/hooks/use-toast";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	read: boolean;
	createdAt: Date;
	actionUrl?: string;
}

interface NotificationCenterProps {
	notifications: Notification[];
	onMarkAsRead: (id: string) => void;
	onMarkAllAsRead: () => void;
	onDelete: (id: string) => void;
	onDeleteAll: () => void;
}

export function NotificationCenter({
	notifications,
	onMarkAsRead,
	onMarkAllAsRead,
	onDelete,
	onDeleteAll,
}: NotificationCenterProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { toast } = useToast();

	const unreadCount = notifications.filter((n) => !n.read).length;

	const handleMarkAsRead = (id: string) => {
		onMarkAsRead(id);
		toast({
			title: "Notification marked as read",
			description: "The notification has been marked as read.",
		});
	};

	const handleMarkAllAsRead = () => {
		onMarkAllAsRead();
		toast({
			title: "All notifications marked as read",
			description: "All notifications have been marked as read.",
		});
	};

	const handleDelete = (id: string) => {
		onDelete(id);
		toast({
			title: "Notification deleted",
			description: "The notification has been deleted.",
		});
	};

	const handleDeleteAll = () => {
		onDeleteAll();
		toast({
			title: "All notifications deleted",
			description: "All notifications have been deleted.",
		});
	};

	const getNotificationIcon = (type: Notification["type"]) => {
		switch (type) {
			case "success":
				return "✅";
			case "warning":
				return "⚠️";
			case "error":
				return "❌";
			default:
				return "ℹ️";
		}
	};

	const getNotificationColor = (type: Notification["type"]) => {
		switch (type) {
			case "success":
				return "text-green-600";
			case "warning":
				return "text-yellow-600";
			case "error":
				return "text-red-600";
			default:
				return "text-blue-600";
		}
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
						>
							{unreadCount > 99 ? "99+" : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<Card className="border-0 shadow-none">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">Notifications</CardTitle>
							<div className="flex space-x-2">
								{unreadCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleMarkAllAsRead}
										className="text-xs"
									>
										Mark all read
									</Button>
								)}
								{notifications.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleDeleteAll}
										className="text-xs text-red-600 hover:text-red-700"
									>
										Clear all
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-96">
							{notifications.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<Bell className="h-12 w-12 text-gray-400" />
									<p className="mt-2 text-sm text-gray-500">
										No notifications yet
									</p>
								</div>
							) : (
								<div className="space-y-1 p-2">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
												!notification.read ? "bg-blue-50 border-blue-200" : ""
											}`}
										>
											<div className="flex items-start space-x-3">
												<span className="text-lg">
													{getNotificationIcon(notification.type)}
												</span>
												<div className="flex-1 min-w-0">
													<div className="flex items-center justify-between">
														<h4
															className={`text-sm font-medium ${
																!notification.read ? "font-semibold" : ""
															}`}
														>
															{notification.title}
														</h4>
														<div className="flex items-center space-x-1">
															{!notification.read && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleMarkAsRead(notification.id)
																	}
																	className="h-6 w-6 p-0"
																>
																	<Check className="h-3 w-3" />
																</Button>
															)}
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleDelete(notification.id)}
																className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
															>
																<X className="h-3 w-3" />
															</Button>
														</div>
													</div>
													<p className="mt-1 text-sm text-gray-600">
														{notification.message}
													</p>
													<p className="mt-1 text-xs text-gray-400">
														{new Date(notification.createdAt).toLocaleString()}
													</p>
													{notification.actionUrl && (
														<Button
															variant="link"
															size="sm"
															className="mt-2 h-auto p-0 text-xs"
															onClick={() => {
																window.location.href = notification.actionUrl!;
															}}
														>
															View details
														</Button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
