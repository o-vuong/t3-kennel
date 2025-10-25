import { db } from "~/server/db";
import { cacheManager, CACHE_KEYS } from "./cache-manager";
import { UserRole } from "@prisma/client";

export interface CachedUserPermissions {
	userId: string;
	role: UserRole;
	permissions: string[];
	canAccessKennel: (kennelId: string) => boolean;
	canManageUsers: boolean;
	canViewReports: boolean;
	canProcessPayments: boolean;
	canManageKennels: boolean;
	canViewAuditLogs: boolean;
}

export class UserCacheService {
	async getUserPermissions(userId: string): Promise<CachedUserPermissions | null> {
		// Try cache first
		const cached = await cacheManager.get<CachedUserPermissions>(
			CACHE_KEYS.USER_PERMISSIONS(userId),
			{ ttl: 1800 } // 30 minutes
		);

		if (cached) {
			return cached;
		}

		// Fetch from database
		const user = await db.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				role: true,
				staffAssignments: {
					select: {
						kennelId: true,
					},
				},
			},
		});

		if (!user) {
			return null;
		}

		// Build permissions based on role
		const permissions = this.buildPermissions(user.role, user.staffAssignments);
		const assignedKennelIds = user.staffAssignments.map((a) => a.kennelId);

		const cachedPermissions: CachedUserPermissions = {
			userId: user.id,
			role: user.role,
			permissions: permissions,
			canAccessKennel: (kennelId: string) => {
				// Owner and Admin can access all kennels
				if (user.role === "OWNER" || user.role === "ADMIN") {
					return true;
				}
				// Staff can only access assigned kennels
				if (user.role === "STAFF") {
					return assignedKennelIds.includes(kennelId);
				}
				// Customers can access all kennels for booking
				return true;
			},
			canManageUsers: user.role === "OWNER" || user.role === "ADMIN",
			canViewReports: user.role === "OWNER" || user.role === "ADMIN",
			canProcessPayments: user.role === "OWNER" || user.role === "ADMIN",
			canManageKennels: user.role === "OWNER" || user.role === "ADMIN",
			canViewAuditLogs: user.role === "OWNER",
		};

		// Cache the result
		await cacheManager.set(CACHE_KEYS.USER_PERMISSIONS(userId), cachedPermissions, {
			ttl: 1800, // 30 minutes
		});

		return cachedPermissions;
	}

	async getUserProfile(userId: string): Promise<any | null> {
		// Try cache first
		const cached = await cacheManager.get<any>(
			CACHE_KEYS.USER_PROFILE(userId),
			{ ttl: 600 } // 10 minutes
		);

		if (cached) {
			return cached;
		}

		// Fetch from database
		const user = await db.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				emailVerified: true,
				createdAt: true,
				lastLoginAt: true,
			},
		});

		if (!user) {
			return null;
		}

		// Cache the result
		await cacheManager.set(CACHE_KEYS.USER_PROFILE(userId), user, {
			ttl: 600, // 10 minutes
		});

		return user;
	}

	async getBookingStats(userId: string): Promise<any | null> {
		// Try cache first
		const cached = await cacheManager.get<any>(
			CACHE_KEYS.BOOKING_STATS(userId),
			{ ttl: 300 } // 5 minutes
		);

		if (cached) {
			return cached;
		}

		// Fetch from database
		const stats = await db.booking.aggregate({
			where: { customerId: userId },
			_count: {
				id: true,
			},
			_sum: {
				price: true,
			},
		});

		const recentBookings = await db.booking.count({
			where: {
				customerId: userId,
				createdAt: {
					gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
				},
			},
		});

		const result = {
			totalBookings: stats._count.id,
			totalSpent: stats._sum.price || 0,
			recentBookings,
		};

		// Cache the result
		await cacheManager.set(CACHE_KEYS.BOOKING_STATS(userId), result, {
			ttl: 300, // 5 minutes
		});

		return result;
	}

	async invalidateUserCache(userId: string): Promise<void> {
		await cacheManager.invalidateUserCache(userId);
	}

	private buildPermissions(role: UserRole, staffAssignments: any[]): string[] {
		const basePermissions = ["read:own_profile", "update:own_profile"];

		switch (role) {
			case "OWNER":
				return [
					...basePermissions,
					"read:all_users",
					"create:users",
					"update:users",
					"delete:users",
					"read:all_kennels",
					"create:kennels",
					"update:kennels",
					"delete:kennels",
					"read:all_bookings",
					"create:bookings",
					"update:bookings",
					"delete:bookings",
					"read:reports",
					"process:payments",
					"read:audit_logs",
					"manage:system",
				];

			case "ADMIN":
				return [
					...basePermissions,
					"read:all_users",
					"create:users",
					"update:users",
					"read:all_kennels",
					"create:kennels",
					"update:kennels",
					"read:all_bookings",
					"create:bookings",
					"update:bookings",
					"read:reports",
					"process:payments",
				];

			case "STAFF":
				const assignedKennelIds = staffAssignments.map((a) => a.kennelId);
				return [
					...basePermissions,
					"read:assigned_kennels",
					"read:assigned_bookings",
					"create:care_logs",
					"update:care_logs",
					"check_in:pets",
					"check_out:pets",
				];

			case "CUSTOMER":
				return [
					...basePermissions,
					"read:all_kennels",
					"create:bookings",
					"read:own_bookings",
					"update:own_bookings",
					"cancel:own_bookings",
					"read:own_pets",
					"create:pets",
					"update:own_pets",
					"delete:own_pets",
				];

			default:
				return basePermissions;
		}
	}
}

export const userCacheService = new UserCacheService();
