import type { UserRole } from "@prisma/client";

export const ROLE_VALUES = ["OWNER", "ADMIN", "STAFF", "CUSTOMER"] as const;
const ROLE_SET = new Set<string>(ROLE_VALUES);

export const ROLE_HOME: Record<UserRole, string> = {
	OWNER: "/owner/control",
	ADMIN: "/admin/dashboard",
	STAFF: "/staff/overview",
	CUSTOMER: "/customer/home",
};

export const DEFAULT_HOME_PATH = "/login";

export const isUserRole = (value: unknown): value is UserRole =>
	typeof value === "string" && ROLE_SET.has(value);

export const resolveRoleHome = (role: UserRole) =>
	ROLE_HOME[role] ?? DEFAULT_HOME_PATH;

export const parseUserRole = (value: unknown): UserRole | undefined =>
	isUserRole(value) ? (value as UserRole) : undefined;
