"use client";

import {
	CalendarCheck,
	Grid3X3,
	LayoutDashboard,
	NotebookTabs,
	ShieldCheck,
	UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type AppShortcut = {
	name: string;
	description: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	href: string;
};

const appShortcuts: AppShortcut[] = [
	{
		name: "Dashboard",
		description: "Admin overview",
		icon: LayoutDashboard,
		href: "/admin/dashboard",
	},
	{
		name: "Bookings",
		description: "Manage reservations",
		icon: CalendarCheck,
		href: "/admin/bookings",
	},
	{
		name: "Kennels",
		description: "Capacity and pricing",
		icon: NotebookTabs,
		href: "/admin/kennels",
	},
	{
		name: "Overrides",
		description: "Manual adjustments",
		icon: ShieldCheck,
		href: "/admin/overrides",
	},
	{
		name: "Reports",
		description: "Revenue and metrics",
		icon: Grid3X3,
		href: "/admin/reports",
	},
	{
		name: "Staff Tools",
		description: "Team workflows",
		icon: UsersRound,
		href: "/staff",
	},
];

export function AppSwitcher() {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9"
					aria-label="Open quick navigation"
				>
					<Grid3X3 className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-80 p-4"
				align="end"
				sideOffset={8}
				forceMount
			>
				<DropdownMenuLabel className="mb-3 font-semibold text-muted-foreground text-sm">
					Quick navigation
				</DropdownMenuLabel>
				<div className="grid grid-cols-3 gap-2">
					{appShortcuts.map((shortcut) => {
						const Icon = shortcut.icon;
						return (
							<DropdownMenuItem
								key={shortcut.href}
								className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-muted focus:bg-muted"
								onClick={() => {
									router.push(shortcut.href);
									setOpen(false);
								}}
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
									<Icon className="h-5 w-5 text-muted-foreground" />
								</div>
								<span className="text-center font-medium text-xs">
									{shortcut.name}
								</span>
							</DropdownMenuItem>
						);
					})}
				</div>
				<DropdownMenuSeparator className="my-3" />
				<p className="text-center text-muted-foreground text-xs">
					Add more destinations from settings.
				</p>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
