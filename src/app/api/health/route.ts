import { env } from "~/env";
import { db } from "~/server/db";

interface HealthCheck {
	name: string;
	status: "healthy" | "unhealthy" | "degraded";
	responseTime?: number;
	details?: Record<string, any>;
}

export async function GET() {
	const checks: HealthCheck[] = [];
	const startTime = Date.now();

	// Database check
	const dbStart = Date.now();
	try {
		await db.$queryRaw`SELECT 1`;
		checks.push({
			name: "database",
			status: "healthy",
			responseTime: Date.now() - dbStart,
		});
	} catch (error) {
		checks.push({
			name: "database",
			status: "unhealthy",
			responseTime: Date.now() - dbStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	// Redis check
	const redisStart = Date.now();
	if (env.REDIS_URL) {
		try {
			const { getRedisClient } = await import("~/lib/cache/redis");
			const redis = getRedisClient();
			await redis.ping();
			checks.push({
				name: "redis",
				status: "healthy",
				responseTime: Date.now() - redisStart,
			});
		} catch (error) {
			checks.push({
				name: "redis",
				status: "unhealthy",
				responseTime: Date.now() - redisStart,
				details: { error: error instanceof Error ? error.message : "Unknown error" },
			});
		}
	} else {
		checks.push({
			name: "redis",
			status: "healthy",
			responseTime: 0,
			details: { message: "Not configured" },
		});
	}

	// VAPID keys check
	checks.push({
		name: "vapid",
		status: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) ? "healthy" : "degraded",
		details: {
			publicKey: !!env.VAPID_PUBLIC_KEY,
			privateKey: !!env.VAPID_PRIVATE_KEY,
		},
	});

	// SMTP configuration check
	checks.push({
		name: "smtp",
		status: !!(env.SMTP_HOST && env.SMTP_USER) ? "healthy" : "degraded",
		details: {
			host: !!env.SMTP_HOST,
			user: !!env.SMTP_USER,
		},
	});

	// Stripe configuration check
	checks.push({
		name: "stripe",
		status: !!(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ? "healthy" : "degraded",
		details: {
			secretKey: !!env.STRIPE_SECRET_KEY,
			publishableKey: !!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		},
	});

	// Memory usage check
	const memUsage = process.memoryUsage();
	const memUsageMB = {
		rss: Math.round(memUsage.rss / 1024 / 1024),
		heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
		heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
		external: Math.round(memUsage.external / 1024 / 1024),
	};

	checks.push({
		name: "memory",
		status: memUsageMB.heapUsed > 500 ? "degraded" : "healthy", // Alert if heap usage > 500MB
		details: memUsageMB,
	});

	// Uptime check
	const uptime = process.uptime();
	checks.push({
		name: "uptime",
		status: "healthy",
		details: {
			seconds: Math.round(uptime),
			formatted: formatUptime(uptime),
		},
	});

	const overallStatus = checks.every(c => c.status === "healthy") 
		? "healthy" 
		: checks.some(c => c.status === "unhealthy") 
		? "unhealthy" 
		: "degraded";

	return Response.json(
		{
			status: overallStatus,
			version: process.env.GIT_SHA ?? "dev",
			environment: env.NODE_ENV,
			checks,
			summary: {
				totalChecks: checks.length,
				healthy: checks.filter(c => c.status === "healthy").length,
				degraded: checks.filter(c => c.status === "degraded").length,
				unhealthy: checks.filter(c => c.status === "unhealthy").length,
				responseTime: Date.now() - startTime,
			},
			timestamp: new Date().toISOString(),
		},
		{ status: overallStatus === "unhealthy" ? 503 : 200 }
	);
}

function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
	if (minutes > 0) return `${minutes}m ${secs}s`;
	return `${secs}s`;
}
