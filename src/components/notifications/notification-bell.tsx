"use client";

import { NotificationCenter } from "./notification-center";
import { useNotifications } from "~/hooks/use-notifications";

export function NotificationBell() {
	const {
		notifications,
		unreadCount,
		isLoading,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		deleteAllNotifications,
	} = useNotifications();

	if (isLoading) {
		return (
			<div className="h-9 w-9 animate-pulse rounded-md bg-gray-200" />
		);
	}

	return (
		<NotificationCenter
			notifications={notifications}
			onMarkAsRead={markAsRead}
			onMarkAllAsRead={markAllAsRead}
			onDelete={deleteNotification}
			onDeleteAll={deleteAllNotifications}
		/>
	);
}
