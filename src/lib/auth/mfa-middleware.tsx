"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth/client";
import { parseUserRole } from "~/lib/auth/roles";

interface MFAStatus {
	totpEnabled: boolean;
	webauthnEnabled: boolean;
	lastVerifiedAt: string | null;
}

interface MFAMiddlewareProps {
	children: React.ReactNode;
	requireFresh?: boolean; // Within 5 minutes
	requireRecent?: boolean; // Within 12 hours
}

export function MFAMiddleware({ 
	children, 
	requireFresh = false, 
	requireRecent = true 
}: MFAMiddlewareProps) {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		if (isPending || !session) {
			return;
		}

		const role = parseUserRole((session.user as { role?: unknown })?.role);
		const requiresMFA = role === "OWNER" || role === "ADMIN";

		if (!requiresMFA) {
			setIsChecking(false);
			return;
		}

		checkMFAStatus();
	}, [session, isPending]);

	const checkMFAStatus = async () => {
		try {
			const response = await fetch("/api/auth/mfa/status");
			if (!response.ok) {
				router.replace("/login");
				return;
			}

			const status = await response.json();
			setMfaStatus(status);

			// If MFA is not set up, redirect to setup
			if (!status.totpEnabled && !status.webauthnEnabled) {
				router.replace("/mfa/setup");
				return;
			}

			// Check verification timing
			const lastVerified = status.lastVerifiedAt 
				? new Date(status.lastVerifiedAt)
				: null;
			const now = new Date();
			const timeSinceVerification = lastVerified 
				? now.getTime() - lastVerified.getTime()
				: Infinity;

			// Check if fresh verification is required (5 minutes)
			if (requireFresh && timeSinceVerification > 5 * 60 * 1000) {
				router.replace("/mfa/verify?fresh=true");
				return;
			}

			// Check if recent verification is required (12 hours)
			if (requireRecent && timeSinceVerification > 12 * 60 * 60 * 1000) {
				router.replace("/mfa/verify");
				return;
			}

			setIsChecking(false);
		} catch (error) {
			console.error("MFA check failed:", error);
			router.replace("/login");
		}
	};

	if (isPending || isChecking) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">Verifying security requirements...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
