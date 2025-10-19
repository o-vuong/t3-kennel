import { env } from "~/env";

// In-memory rate limiter (upgrade to Redis in Phase 5)
const limiters = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const limiter = limiters.get(key);

	if (!limiter || now > limiter.resetAt) {
		limiters.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: maxRequests - 1 };
	}

	if (limiter.count >= maxRequests) {
		return { allowed: false, remaining: 0 };
	}

	limiter.count++;
	return { allowed: true, remaining: maxRequests - limiter.count };
}

// Clean up expired limiters periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, limiter] of limiters.entries()) {
		if (now > limiter.resetAt) {
			limiters.delete(key);
		}
	}
}, 60000); // Clean up every minute

// Rate limiting presets
export const RATE_LIMITS = {
	LOGIN: {
		maxRequests: Number.parseInt(env.RATE_LIMIT_LOGIN_PER_MIN),
		windowMs: 60 * 1000, // 1 minute
	},
	API: {
		maxRequests: Number.parseInt(env.RATE_LIMIT_API_PER_MIN),
		windowMs: 60 * 1000, // 1 minute
	},
	CSP_REPORT: {
		maxRequests: 10,
		windowMs: 60 * 1000, // 1 minute
	},
} as const;
