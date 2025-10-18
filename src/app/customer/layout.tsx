import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";

import { requireRole } from "~/lib/auth/server";

const CUSTOMER_ROLES: UserRole[] = ["OWNER", "ADMIN", "STAFF", "CUSTOMER"];

export default async function CustomerLayout({ children }: { children: ReactNode }) {
	await requireRole(CUSTOMER_ROLES);
	return <>{children}</>;
}
