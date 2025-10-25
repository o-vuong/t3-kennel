import type { ReactNode } from "react";

import { MFAMiddleware } from "~/lib/auth/mfa-middleware";

export default function OverridesLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<MFAMiddleware requireFresh={true} requireRecent={true}>
			{children}
		</MFAMiddleware>
	);
}
