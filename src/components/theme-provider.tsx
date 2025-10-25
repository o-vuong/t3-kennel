"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: string;
	enableSystem?: boolean;
	attribute?: "class" | "data-theme";
};

export function ThemeProvider({
	children,
	defaultTheme = "light",
	enableSystem = true,
	attribute = "class",
	...props
}: ThemeProviderProps) {
	return (
		<NextThemesProvider
			defaultTheme={defaultTheme}
			enableSystem={enableSystem}
			attribute={attribute}
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
