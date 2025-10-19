import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { ServiceWorkerManager } from "./_components/service-worker-manager";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Kennel Management System",
	description: "HIPAA-compliant dog kennel management PWA",
	manifest: "/manifest.json",
	themeColor: "#2563eb",
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
	},
	icons: [
		{ rel: "icon", url: "/favicon.ico" },
		{ rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
	],
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Kennel Manager",
	},
	other: {
		"mobile-web-app-capable": "yes",
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "default",
	},
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#2563eb" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Kennel Manager" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
				
				{/* PWA Meta Tags */}
				<meta name="application-name" content="Kennel Manager" />
				<meta name="msapplication-TileColor" content="#2563eb" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
				
				{/* Preconnect to external domains for performance */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			</head>
			<body className="font-sans antialiased bg-gray-50">
				<ServiceWorkerManager />
				<TRPCReactProvider>
					{children}
				</TRPCReactProvider>
			</body>
		</html>
	);
}
