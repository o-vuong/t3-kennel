import type { Notification, Prisma } from "@prisma/client";

import { db } from "~/server/db";

type DispatchNotificationInput = {
	userId: string;
	type: string;
	title: string;
	message: string;
	payload?: Record<string, unknown>;
	status?: string;
};

/**
 * Persists a notification for a user and returns the created record.
 * Future enhancements can extend this to send web push or email.
 */
export async function dispatchNotification(
	input: DispatchNotificationInput,
): Promise<Notification> {
	return db.notification.create({
		data: {
			userId: input.userId,
			type: input.type,
			title: input.title,
			message: input.message,
			payload: (input.payload ?? {}) as Prisma.InputJsonValue,
			status: input.status ?? "unread",
		},
	});
}

export async function dispatchNotifications(
	notifications: DispatchNotificationInput[],
): Promise<Notification[]> {
	return Promise.all(
		notifications.map((notification) => dispatchNotification(notification)),
	);
}
