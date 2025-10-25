"use client";

import { AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/hooks/use-toast";

interface RefundProcessorProps {
	bookingId: string;
	bookingAmount: number;
	customerName: string;
	petName: string;
	onRefundProcessed?: () => void;
}

export function RefundProcessor({
	bookingId,
	bookingAmount,
	customerName,
	petName,
	onRefundProcessed,
}: RefundProcessorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [refundType, setRefundType] = useState<"full" | "partial">("full");
	const [refundAmount, setRefundAmount] = useState(bookingAmount);
	const [reason, setReason] = useState("");
	const { toast } = useToast();

	const handleRefund = async () => {
		if (!reason.trim()) {
			toast({
				title: "Reason Required",
				description: "Please provide a reason for the refund.",
				variant: "destructive",
			});
			return;
		}

		if (refundType === "partial" && refundAmount <= 0) {
			toast({
				title: "Invalid Amount",
				description: "Refund amount must be greater than 0.",
				variant: "destructive",
			});
			return;
		}

		if (refundType === "partial" && refundAmount > bookingAmount) {
			toast({
				title: "Invalid Amount",
				description: "Refund amount cannot exceed booking amount.",
				variant: "destructive",
			});
			return;
		}

		setIsProcessing(true);

		try {
			const response = await fetch("/api/payments/refund", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookingId,
					amount: refundType === "partial" ? refundAmount : undefined,
					reason,
					refundType,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to process refund");
			}

			toast({
				title: "Refund Processed",
				description: `Refund of $${refundAmount.toFixed(2)} has been processed successfully.`,
			});

			setIsOpen(false);
			setReason("");
			onRefundProcessed?.();
		} catch (error) {
			console.error("Refund processing error:", error);
			const errorMessage = error instanceof Error ? error.message : "Refund failed";
			
			toast({
				title: "Refund Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<DollarSign className="mr-2 h-4 w-4" />
					Process Refund
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Process Refund</DialogTitle>
					<DialogDescription>
						Process a refund for {customerName}'s booking for {petName}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							Refunds are processed immediately and cannot be undone. Please verify all details before proceeding.
						</AlertDescription>
					</Alert>

					<div className="space-y-2">
						<Label>Refund Type</Label>
						<div className="flex space-x-4">
							<label className="flex items-center space-x-2">
								<input
									type="radio"
									value="full"
									checked={refundType === "full"}
									onChange={(e) => setRefundType(e.target.value as "full" | "partial")}
									className="rounded"
								/>
								<span>Full Refund (${bookingAmount.toFixed(2)})</span>
							</label>
							<label className="flex items-center space-x-2">
								<input
									type="radio"
									value="partial"
									checked={refundType === "partial"}
									onChange={(e) => setRefundType(e.target.value as "full" | "partial")}
									className="rounded"
								/>
								<span>Partial Refund</span>
							</label>
						</div>
					</div>

					{refundType === "partial" && (
						<div className="space-y-2">
							<Label htmlFor="refundAmount">Refund Amount</Label>
							<Input
								id="refundAmount"
								type="number"
								step="0.01"
								min="0.01"
								max={bookingAmount}
								value={refundAmount}
								onChange={(e) => setRefundAmount(Number(e.target.value))}
								placeholder="Enter refund amount"
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="reason">Reason for Refund *</Label>
						<Input
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Enter reason for refund"
							required
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isProcessing}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRefund}
						disabled={isProcessing || !reason.trim()}
						variant="destructive"
					>
						{isProcessing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							"Process Refund"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
