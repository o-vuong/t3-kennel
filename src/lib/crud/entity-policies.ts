import type {
	Booking,
	CareLog,
	Kennel,
	Notification,
	Pet,
	User,
	UserRole,
} from "@prisma/client";

import {
	type EntityPolicy,
	type PolicyResult,
	type PolicyContext,
} from "./types";
import {
	canCreateBooking,
	canOverridePolicy,
	createPolicyContext,
} from "./policy";

const allow = (): PolicyResult => ({ allowed: true });
const deny = (reason: string): PolicyResult => ({ allowed: false, reason });

const isSelf = (context: PolicyContext, userId?: string) =>
	userId !== undefined && userId === context.user.id;

export const userEntityPolicy: EntityPolicy<User> = {
	canCreate: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can create users");
	},
	canRead: (context, entity) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (isSelf(context, entity.id)) return allow();
		return deny("Insufficient permissions to view this user");
	},
	canUpdate: (context, entity) => {
		if (context.isOwner) return allow();
		if (context.isAdmin && entity.role !== "OWNER") return allow();
		if (isSelf(context, entity.id)) return allow();
		return deny("Insufficient permissions to update this user");
	},
	canDelete: (context, entity) => {
		if (context.isOwner && entity.id !== context.user.id) return allow();
		if (context.isAdmin && entity.role !== "OWNER" && entity.role !== "ADMIN")
			return allow();
		return deny("Insufficient permissions to delete this user");
	},
	canList: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can list users");
	},
};

export const petEntityPolicy: EntityPolicy<Pet> = {
	canCreate: (context, data) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer && isSelf(context, data.ownerId)) return allow();
		return deny("Cannot create pets for other customers");
	},
	canRead: (context, pet) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer && isSelf(context, pet.ownerId)) return allow();
		return deny("Insufficient permissions to view this pet");
	},
	canUpdate: (context, pet) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer && isSelf(context, pet.ownerId)) return allow();
		return deny("Insufficient permissions to update this pet");
	},
	canDelete: (context, pet) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (context.isCustomer && isSelf(context, pet.ownerId)) return allow();
		return deny("Insufficient permissions to delete this pet");
	},
	canList: (context) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer) return allow();
		return deny("Insufficient permissions");
	},
};

export const bookingEntityPolicy: EntityPolicy<Booking> = {
	canCreate: (context, data) => canCreateBooking(context, data.customerId),
	canRead: (context, booking) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer && isSelf(context, booking.customerId)) return allow();
		return deny("Insufficient permissions to view this booking");
	},
	canUpdate: (context, booking) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (context.isStaff) {
			return {
				allowed: false,
				reason: "Staff updates require override token",
				requiresOverride: true,
				overrideScope: "POLICY_BYPASS",
			};
		}
		if (context.isCustomer && isSelf(context, booking.customerId)) {
			return {
				allowed: false,
				reason: "Customer updates require override",
				requiresOverride: true,
				overrideScope: "POLICY_BYPASS",
			};
		}
		return deny("Insufficient permissions to update this booking");
	},
	canDelete: (context, booking) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (context.isCustomer && isSelf(context, booking.customerId)) {
			return {
				allowed: false,
				reason: "Customer cancellations require override",
				requiresOverride: true,
				overrideScope: "POLICY_BYPASS",
			};
		}
		return deny("Insufficient permissions to delete this booking");
	},
	canList: (context) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer) return allow();
		return deny("Insufficient permissions");
	},
};

export const careLogEntityPolicy: EntityPolicy<CareLog> = {
	canCreate: (context, data) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		return deny("Only staff can create care logs");
	},
	canRead: (context, log) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer) return allow();
		return deny("Insufficient permissions to view care logs");
	},
	canUpdate: (context, log) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (context.isStaff && isSelf(context, log.staffId)) return allow();
		return deny("Insufficient permissions to update this care log");
	},
	canDelete: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can delete care logs");
	},
	canList: (context) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer) return allow();
		return deny("Insufficient permissions");
	},
};

export const notificationEntityPolicy: EntityPolicy<Notification> = {
	canCreate: (context, data) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer && isSelf(context, data.userId)) return allow();
		return deny("Cannot create notifications for other users");
	},
	canRead: (context, notification) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (isSelf(context, notification.userId)) return allow();
		return deny("Insufficient permissions to view this notification");
	},
	canUpdate: (context, notification) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (isSelf(context, notification.userId)) return allow();
		return deny("Insufficient permissions to update this notification");
	},
	canDelete: (context, notification) => {
		if (context.isOwner || context.isAdmin) return allow();
		if (isSelf(context, notification.userId)) return allow();
		return deny("Insufficient permissions to delete this notification");
	},
	canList: (context) => {
		if (context.isOwner || context.isAdmin || context.isStaff) return allow();
		if (context.isCustomer) return allow();
		return deny("Insufficient permissions");
	},
};

export const kennelEntityPolicy: EntityPolicy<Kennel> = {
	canCreate: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can create kennels");
	},
	canRead: () => allow(),
	canUpdate: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can update kennels");
	},
	canDelete: (context) => {
		if (context.isOwner || context.isAdmin) return allow();
		return deny("Only administrators can delete kennels");
	},
	canList: () => allow(),
};

export const getContext = createPolicyContext;

export const needsOverride = (
	context: PolicyContext,
	scope: string,
): PolicyResult => canOverridePolicy(context, scope);
