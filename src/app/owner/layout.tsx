import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";

import { requireRole } from "~/lib/auth/server";
import { MFAMiddleware } from "~/lib/auth/mfa-middleware";

const OWNER_ROLES: UserRole[] = ["OWNER"];

export default async function OwnerLayout({
	children,
}: {
	children: ReactNode;
}) {
	await requireRole(OWNER_ROLES);
	return (
		<MFAMiddleware requireFresh={false} requireRecent={true}>
			{children}
		</MFAMiddleware>
	);
}
