import Stripe from "stripe";

import { env } from "~/env";

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
	if (!stripeClient) {
		stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
	}

	return stripeClient;
};
