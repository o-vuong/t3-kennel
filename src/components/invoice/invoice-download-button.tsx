"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";

interface InvoiceDownloadButtonProps {
	bookingId: string;
	className?: string;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	size?: "default" | "sm" | "lg" | "icon";
	disabled?: boolean;
}

export function InvoiceDownloadButton({
	bookingId,
	className,
	variant = "outline",
	size = "default",
	disabled = false,
}: InvoiceDownloadButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const { toast } = useToast();

	const handleDownload = async () => {
		setIsDownloading(true);

		try {
			const response = await fetch(`/api/invoices/${bookingId}/download`, {
				method: "GET",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to download invoice");
			}

			// Create blob and download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `invoice-${bookingId}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast({
				title: "Invoice Downloaded",
				description: "Your invoice has been downloaded successfully.",
			});
		} catch (error) {
			console.error("Invoice download error:", error);
			const errorMessage = error instanceof Error ? error.message : "Download failed";
			
			toast({
				title: "Download Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Button
			onClick={handleDownload}
			disabled={disabled || isDownloading}
			className={className}
			variant={variant}
			size={size}
		>
			{isDownloading ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Generating...
				</>
			) : (
				<>
					<Download className="mr-2 h-4 w-4" />
					Download Invoice
				</>
			)}
		</Button>
	);
}
