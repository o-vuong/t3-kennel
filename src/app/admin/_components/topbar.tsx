"use client";

import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { signOut, useSession } from "~/lib/auth/client";
import { DEFAULT_HOME_PATH } from "~/lib/auth/roles";
import { AppSwitcher } from "./app-switcher";

export function Topbar() {
	const router = useRouter();
	const { data: session } = useSession();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOut = useCallback(async () => {
		try {
			setIsSigningOut(true);
			await signOut();
			router.replace(DEFAULT_HOME_PATH);
		} catch (error) {
			console.error("Failed to sign out", error);
		} finally {
			setIsSigningOut(false);
		}
	}, [router]);

	const initials =
		session?.user.name
			?.split(" ")
			.map((part) => part.charAt(0))
			.join("")
			.slice(0, 2) ?? "AD";

	return (
		<div className="flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<div className="flex max-w-2xl flex-1 items-center">
				<div className="relative w-full max-w-lg">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search bookings, customers, or kennels..."
						className="h-10 w-full border-0 bg-muted/60 pr-4 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
					/>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<AppSwitcher />
				<ThemeToggle />

				<Button
					variant="ghost"
					size="icon"
					className="relative h-9 w-9 hover:bg-muted"
					aria-label="View notifications"
				>
					<Bell className="h-4 w-4" />
					<span className="-translate-y-1/3 absolute top-0 right-0 flex h-5 w-5 translate-x-1/3 items-center justify-center rounded-full bg-destructive font-semibold text-[0.625rem] text-destructive-foreground">
						3
					</span>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="h-9 w-9 rounded-full p-0 hover:bg-muted"
							aria-label="Open profile menu"
						>
							<Avatar className="h-9 w-9">
								<AvatarImage src={session?.user.image ?? undefined} />
								<AvatarFallback className="bg-primary text-primary-foreground">
									{initials}
								</AvatarFallback>
							</Avatar>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60">
						<DropdownMenuLabel className="flex flex-col gap-1">
							<span className="font-medium text-sm">
								{session?.user.name ?? "Administrator"}
							</span>
							<span className="text-muted-foreground text-xs">
								{session?.user.email ?? "team@kennel.app"}
							</span>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={() => router.push("/admin/overrides")}
						>
							Manage overrides
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={() => router.push("/admin/reports")}
						>
							View reports
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={() => router.push("/owner/control")}
						>
							Switch to owner view
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="cursor-pointer text-destructive focus:text-destructive"
							onSelect={() => {
								void handleSignOut();
							}}
							disabled={isSigningOut}
						>
							{isSigningOut ? "Signing out..." : "Sign out"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
