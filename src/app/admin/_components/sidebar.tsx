"use client";

import {
	CalendarCheck2,
	ChevronLeft,
	ChevronRight,
	LayoutDashboard,
	NotebookPen,
	PieChart,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type SidebarItem = {
	title: string;
	href: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	badge?: string | null;
};

type SidebarGroup = {
	title: string;
	items: SidebarItem[];
};

const sidebarGroups: SidebarGroup[] = [
	{
		title: "Overview",
		items: [
			{
				title: "Dashboard",
				href: "/admin/dashboard",
				icon: LayoutDashboard,
				badge: null,
			},
			{
				title: "Reports",
				href: "/admin/reports",
				icon: PieChart,
				badge: null,
			},
		],
	},
	{
		title: "Operations",
		items: [
			{
				title: "Bookings",
				href: "/admin/bookings",
				icon: CalendarCheck2,
				badge: null,
			},
			{
				title: "Kennel Management",
				href: "/admin/kennels",
				icon: NotebookPen,
				badge: null,
			},
			{
				title: "Overrides",
				href: "/admin/overrides",
				icon: ShieldAlert,
				badge: null,
			},
		],
	},
];

type SidebarProps = {
	onClose?: () => void;
};

export function Sidebar({ onClose }: SidebarProps) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	const handleLinkClick = () => {
		if (onClose) {
			onClose();
		}
	};

	return (
		<aside
			className={cn(
				"flex h-full flex-col border-r bg-card shadow-sm transition-all duration-300",
				collapsed ? "w-16" : "w-72"
			)}
		>
			<div className="flex h-16 items-center justify-between border-b px-6">
				{collapsed ? (
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
						<LayoutDashboard className="h-4 w-4 text-primary-foreground" />
					</div>
				) : (
					<Link
						href="/admin/dashboard"
						onClick={handleLinkClick}
						className="group flex items-center gap-3"
					>
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
							<LayoutDashboard className="h-4 w-4 text-primary-foreground" />
						</div>
						<span className="font-semibold text-lg transition-colors group-hover:text-primary">
							Admin Console
						</span>
					</Link>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-muted"
					onClick={() => setCollapsed((current) => !current)}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? (
						<ChevronRight className="h-4 w-4" aria-hidden />
					) : (
						<ChevronLeft className="h-4 w-4" aria-hidden />
					)}
				</Button>
			</div>

			<nav className="flex-1 space-y-8 overflow-y-auto p-6">
				{sidebarGroups.map((group) => (
					<div key={group.title} className="space-y-3">
						{!collapsed && (
							<p className="px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								{group.title}
							</p>
						)}
						<div className="space-y-2">
							{group.items.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;

								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={handleLinkClick}
										title={collapsed ? item.title : undefined}
										className={cn(
											"group flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-sm transition-all duration-200 hover:bg-muted",
											isActive
												? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
												: "text-muted-foreground hover:text-foreground",
											collapsed && "justify-center px-2 py-4"
										)}
									>
										<Icon
											className={cn(
												"h-4 w-4 transition-transform duration-200 group-hover:scale-105",
												isActive && "text-current"
											)}
										/>
										{!collapsed && <span>{item.title}</span>}
										{!collapsed && item.badge ? (
											<span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
												{item.badge}
											</span>
										) : null}
									</Link>
								);
							})}
						</div>
					</div>
				))}
			</nav>
		</aside>
	);
}
