import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { requireRole } from "~/lib/auth/server";
import { MFAMiddleware } from "~/lib/auth/mfa-middleware";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN"];

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	await requireRole(ADMIN_ROLES);

	return (
		<MFAMiddleware requireFresh={false} requireRecent={true}>
			<div className="relative flex h-screen w-full overflow-hidden bg-background">
				<Sidebar />
				<div className="flex flex-1 flex-col overflow-hidden">
					<Topbar />
					<main className="flex-1 overflow-y-auto bg-muted/10">
						<div className="mx-auto w-full max-w-7xl p-6 md:p-10">{children}</div>
					</main>
				</div>
			</div>
		</MFAMiddleware>
	);
}
