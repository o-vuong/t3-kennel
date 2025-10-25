import { env } from "~/env";
import { rateLimiter } from "./cache/redis";

export async function rateLimit(
	key: string,
	maxRequests: number,
	windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
	return await rateLimiter.checkRateLimit(key, maxRequests, windowMs);
}

// Rate limiting presets
export const RATE_LIMITS = {
	LOGIN: {
		maxRequests: env.RATE_LIMIT_LOGIN_PER_MIN,
		windowMs: 60 * 1000, // 1 minute
	},
	API: {
		maxRequests: env.RATE_LIMIT_API_PER_MIN,
		windowMs: 60 * 1000, // 1 minute
	},
	CSP_REPORT: {
		maxRequests: 10,
		windowMs: 60 * 1000, // 1 minute
	},
} as const;
