import { env } from "~/env";
import { db } from "~/server/db";

interface LivenessCheck {
	name: string;
	status: "alive" | "dead";
	responseTime?: number;
	details?: Record<string, any>;
}

export async function GET() {
	const checks: LivenessCheck[] = [];
	const startTime = Date.now();

	// Process liveness check
	checks.push({
		name: "process",
		status: "alive",
		responseTime: 0,
		details: {
			pid: process.pid,
			uptime: Math.round(process.uptime()),
			version: process.version,
		},
	});

	// Memory health check
	const memUsage = process.memoryUsage();
	const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
	const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
	const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

	checks.push({
		name: "memory",
		status: heapUsagePercent > 90 ? "dead" : "alive", // Alert if heap usage > 90%
		responseTime: 0,
		details: {
			heapUsedMB,
			heapTotalMB,
			heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
			rssMB: Math.round(memUsage.rss / 1024 / 1024),
		},
	});

	// Database liveness check
	const dbStart = Date.now();
	try {
		await db.$queryRaw`SELECT 1`;
		checks.push({
			name: "database",
			status: "alive",
			responseTime: Date.now() - dbStart,
		});
	} catch (error) {
		checks.push({
			name: "database",
			status: "dead",
			responseTime: Date.now() - dbStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	// Redis liveness check (if configured)
	const redisStart = Date.now();
	if (env.REDIS_URL) {
		try {
			const { getRedisClient } = await import("~/lib/cache/redis");
			const redis = getRedisClient();
			await redis.ping();
			checks.push({
				name: "redis",
				status: "alive",
				responseTime: Date.now() - redisStart,
			});
		} catch (error) {
			checks.push({
				name: "redis",
				status: "dead",
				responseTime: Date.now() - redisStart,
				details: { error: error instanceof Error ? error.message : "Unknown error" },
			});
		}
	} else {
		checks.push({
			name: "redis",
			status: "alive",
			responseTime: 0,
			details: { message: "Not configured" },
		});
	}

	// Event loop lag check
	const eventLoopStart = Date.now();
	await new Promise(resolve => setImmediate(resolve));
	const eventLoopLag = Date.now() - eventLoopStart;

	checks.push({
		name: "eventLoop",
		status: eventLoopLag > 100 ? "dead" : "alive", // Alert if event loop lag > 100ms
		responseTime: eventLoopLag,
		details: {
			lagMs: eventLoopLag,
		},
	});

	const overallStatus = checks.every(c => c.status === "alive") ? "alive" : "dead";

	return Response.json(
		{
			status: overallStatus,
			version: process.env.GIT_SHA ?? "dev",
			environment: env.NODE_ENV,
			checks,
			summary: {
				totalChecks: checks.length,
				alive: checks.filter(c => c.status === "alive").length,
				dead: checks.filter(c => c.status === "dead").length,
				responseTime: Date.now() - startTime,
			},
			timestamp: new Date().toISOString(),
		},
		{ status: overallStatus === "alive" ? 200 : 503 }
	);
}
