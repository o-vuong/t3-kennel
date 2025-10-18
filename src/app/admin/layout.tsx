import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";

import { requireRole } from "~/lib/auth/server";

const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
	await requireRole(ADMIN_ROLES);
	return <>{children}</>;
}
