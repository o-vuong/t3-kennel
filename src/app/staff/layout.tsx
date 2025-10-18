import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";

import { requireRole } from "~/lib/auth/server";

const STAFF_ROLES: UserRole[] = ["OWNER", "ADMIN", "STAFF"];

export default async function StaffLayout({ children }: { children: ReactNode }) {
	await requireRole(STAFF_ROLES);
	return <>{children}</>;
}
