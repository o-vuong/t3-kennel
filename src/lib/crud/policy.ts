import type { UserRole } from "@prisma/client";
import type { PolicyContext, PolicyResult } from "./types";

/**
 * Role-based access control utilities
 * Implements the Owner > Admin > Staff > Customer hierarchy
 */

export function createPolicyContext(user: any): PolicyContext {
	const role = user.role as UserRole;
	return {
		user,
		role,
		customerId: role === "CUSTOMER" ? user.id : undefined,
		isOwner: role === "OWNER",
		isAdmin: role === "ADMIN",
		isStaff: role === "STAFF",
		isCustomer: role === "CUSTOMER",
	};
}

/**
 * Check if user can access admin functions
 */
export function canAccessAdmin(context: PolicyContext): PolicyResult {
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}
	return {
		allowed: false,
		reason: "Admin access required",
	};
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(
	context: PolicyContext,
	_targetUserId?: string
): PolicyResult {
	// Owner can manage everyone
	if (context.isOwner) {
		return { allowed: true };
	}

	// Admin can manage everyone except owner
	if (context.isAdmin) {
		return { allowed: true };
	}

	// Staff and customers cannot manage users
	return {
		allowed: false,
		reason: "User management requires admin or owner role",
	};
}

/**
 * Check if user can create bookings
 */
export function canCreateBooking(
	context: PolicyContext,
	customerId?: string
): PolicyResult {
	// Owner and admin can create bookings for anyone
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}

	// Staff can create bookings for anyone
	if (context.isStaff) {
		return { allowed: true };
	}

	// Customers can only create bookings for themselves
	if (context.isCustomer && (!customerId || customerId === context.user.id)) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Cannot create booking for other customers",
	};
}

/**
 * Check if user can view bookings
 */
export function canViewBooking(
	context: PolicyContext,
	customerId: string
): PolicyResult {
	// Owner, admin, and staff can view all bookings
	if (context.isOwner || context.isAdmin || context.isStaff) {
		return { allowed: true };
	}

	// Customers can only view their own bookings
	if (context.isCustomer && customerId === context.user.id) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Cannot view other customers' bookings",
	};
}

/**
 * Check if user can perform refunds
 */
export function canProcessRefund(context: PolicyContext): PolicyResult {
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Refunds require admin or owner approval",
		requiresOverride: true,
		overrideScope: "REFUND",
	};
}

/**
 * Check if user can override policies
 */
export function canOverridePolicy(
	context: PolicyContext,
	scope: string
): PolicyResult {
	// Owner can override everything
	if (context.isOwner) {
		return { allowed: true };
	}

	// Admin can override most policies except owner actions
	if (context.isAdmin) {
		return { allowed: true };
	}

	// Staff need approval tokens for overrides
	if (context.isStaff) {
		return {
			allowed: false,
			reason: "Staff overrides require approval token",
			requiresOverride: true,
			overrideScope: scope,
		};
	}

	return {
		allowed: false,
		reason: "Override requires admin or owner role",
	};
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(context: PolicyContext): PolicyResult {
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Audit logs require admin or owner access",
	};
}

/**
 * Check if user can export data
 */
export function canExportData(context: PolicyContext): PolicyResult {
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Data export requires admin or owner approval",
		requiresOverride: true,
		overrideScope: "EXPORT",
	};
}

/**
 * Check if user can access PHI (Protected Health Information)
 */
export function canAccessPHI(
	context: PolicyContext,
	customerId: string
): PolicyResult {
	// Owner and admin can access all PHI
	if (context.isOwner || context.isAdmin) {
		return { allowed: true };
	}

	// Staff can access PHI for operational purposes
	if (context.isStaff) {
		return { allowed: true };
	}

	// Customers can only access their own PHI
	if (context.isCustomer && customerId === context.user.id) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "PHI access restricted to authorized personnel and data owner",
	};
}

/**
 * Check if user can modify system settings
 */
export function canModifySettings(context: PolicyContext): PolicyResult {
	if (context.isOwner) {
		return { allowed: true };
	}

	if (context.isAdmin) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "System settings require owner or admin access",
	};
}
