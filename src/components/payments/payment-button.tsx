"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";

interface PaymentButtonProps {
	bookingId: string;
	amount: number;
	currency?: string;
	description?: string;
	onSuccess?: () => void;
	onError?: (error: string) => void;
	className?: string;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	size?: "default" | "sm" | "lg" | "icon";
	disabled?: boolean;
}

export function PaymentButton({
	bookingId,
	amount,
	currency = "usd",
	description,
	onSuccess,
	onError,
	className,
	variant = "default",
	size = "default",
	disabled = false,
}: PaymentButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const handlePayment = async () => {
		setIsLoading(true);

		try {
			const response = await fetch("/api/payments/create-checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookingId,
					amount,
					currency,
					description,
					successUrl: `${window.location.origin}/customer/bookings?payment=success`,
					cancelUrl: `${window.location.origin}/customer/bookings?payment=cancelled`,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to create payment session");
			}

			// Redirect to Stripe Checkout
			window.location.href = result.checkoutUrl;
		} catch (error) {
			console.error("Payment initiation error:", error);
			const errorMessage = error instanceof Error ? error.message : "Payment failed";
			
			toast({
				title: "Payment Error",
				description: errorMessage,
				variant: "destructive",
			});

			onError?.(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handlePayment}
			disabled={disabled || isLoading}
			className={className}
			variant={variant}
			size={size}
		>
			{isLoading ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Processing...
				</>
			) : (
				<>
					<CreditCard className="mr-2 h-4 w-4" />
					Pay ${amount.toFixed(2)}
				</>
			)}
		</Button>
	);
}
