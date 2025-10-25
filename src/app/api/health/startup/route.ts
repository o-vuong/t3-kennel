import { env } from "~/env";
import { db } from "~/server/db";

interface StartupCheck {
	name: string;
	status: "started" | "starting" | "failed";
	responseTime?: number;
	details?: Record<string, any>;
}

export async function GET() {
	const checks: StartupCheck[] = [];
	const startTime = Date.now();

	// Basic application startup check
	checks.push({
		name: "application",
		status: "started",
		responseTime: 0,
		details: {
			nodeVersion: process.version,
			platform: process.platform,
			architecture: process.arch,
			pid: process.pid,
		},
	});

	// Environment configuration check
	const envStart = Date.now();
	const criticalEnvVars = [
		'DATABASE_URL',
		'BETTER_AUTH_SECRET',
		'ENCRYPTION_KEY',
	];
	
	const missingCriticalVars = criticalEnvVars.filter(envVar => !process.env[envVar]);
	
	checks.push({
		name: "environment",
		status: missingCriticalVars.length === 0 ? "started" : "failed",
		responseTime: Date.now() - envStart,
		details: {
			critical: criticalEnvVars,
			missing: missingCriticalVars,
			environment: env.NODE_ENV,
		},
	});

	// Database connection check
	const dbStart = Date.now();
	try {
		await db.$queryRaw`SELECT 1`;
		checks.push({
			name: "database",
			status: "started",
			responseTime: Date.now() - dbStart,
		});
	} catch (error) {
		checks.push({
			name: "database",
			status: "failed",
			responseTime: Date.now() - dbStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	// Redis connection check (optional)
	const redisStart = Date.now();
	if (env.REDIS_URL) {
		try {
			const { getRedisClient } = await import("~/lib/cache/redis");
			const redis = getRedisClient();
			await redis.ping();
			checks.push({
				name: "redis",
				status: "started",
				responseTime: Date.now() - redisStart,
			});
		} catch (error) {
			checks.push({
				name: "redis",
				status: "failed",
				responseTime: Date.now() - redisStart,
				details: { error: error instanceof Error ? error.message : "Unknown error" },
			});
		}
	} else {
		checks.push({
			name: "redis",
			status: "started",
			responseTime: 0,
			details: { message: "Not configured" },
		});
	}

	// Memory and resource check
	const memUsage = process.memoryUsage();
	const memUsageMB = {
		rss: Math.round(memUsage.rss / 1024 / 1024),
		heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
		heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
		external: Math.round(memUsage.external / 1024 / 1024),
	};

	checks.push({
		name: "resources",
		status: "started",
		responseTime: 0,
		details: {
			memory: memUsageMB,
			uptime: Math.round(process.uptime()),
		},
	});

	const overallStatus = checks.every(c => c.status === "started") ? "started" : "failed";

	return Response.json(
		{
			status: overallStatus,
			version: process.env.GIT_SHA ?? "dev",
			environment: env.NODE_ENV,
			checks,
			summary: {
				totalChecks: checks.length,
				started: checks.filter(c => c.status === "started").length,
				failed: checks.filter(c => c.status === "failed").length,
				responseTime: Date.now() - startTime,
			},
			timestamp: new Date().toISOString(),
		},
		{ status: overallStatus === "started" ? 200 : 503 }
	);
}
