import type { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, type Session } from "./better-auth";
import { DEFAULT_HOME_PATH, parseUserRole, resolveRoleHome } from "./roles";

export const getServerSession = cache(async () => {
	const heads = new Headers(await headers());
	return auth.api.getSession({
		headers: heads,
	});
});

export const requireAuth = async () => {
	const session = await getServerSession();
	if (!session) {
		redirect(DEFAULT_HOME_PATH);
	}

	return session;
};

const FALLBACK_ROLE: UserRole = "CUSTOMER";

export const requireRole = async (allowedRoles: UserRole[]) => {
	const session = await requireAuth();
	const role = parseUserRole((session.user as { role?: unknown })?.role);

	if (!role || !allowedRoles.includes(role)) {
		redirect(resolveRoleHome(role ?? FALLBACK_ROLE));
	}

	return session;
};

export const redirectToRoleHome = (session: Session) => {
	const role = parseUserRole((session.user as { role?: unknown })?.role);
	redirect(resolveRoleHome(role ?? FALLBACK_ROLE));
};
