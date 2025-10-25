"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	read: boolean;
	createdAt: Date;
	actionUrl?: string;
}

export function useNotifications() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch notifications
	const { data: notificationsData, refetch } = api.notifications.list.useQuery(
		{},
		{
			refetchInterval: 30000, // Refetch every 30 seconds
		}
	);

	// Mark as read mutation
	const markAsReadMutation = api.notifications.markAsRead.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	// Mark all as read mutation
	const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	// Delete notification mutation
	const deleteNotificationMutation = api.notifications.delete.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	// Delete all notifications mutation
	const deleteAllNotificationsMutation = api.notifications.deleteAll.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	// Update local state when data changes
	useEffect(() => {
		if (notificationsData) {
			setNotifications(notificationsData);
			setIsLoading(false);
		}
	}, [notificationsData]);

	// Mark notification as read
	const markAsRead = (id: string) => {
		markAsReadMutation.mutate({ id });
	};

	// Mark all notifications as read
	const markAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	// Delete notification
	const deleteNotification = (id: string) => {
		deleteNotificationMutation.mutate({ id });
	};

	// Delete all notifications
	const deleteAllNotifications = () => {
		deleteAllNotificationsMutation.mutate();
	};

	// Get unread count
	const unreadCount = notifications.filter((n) => !n.read).length;

	// Get recent notifications (last 5)
	const recentNotifications = notifications
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	return {
		notifications,
		recentNotifications,
		unreadCount,
		isLoading,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		deleteAllNotifications,
		refetch,
	};
}
