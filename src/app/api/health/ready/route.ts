import { env } from "~/env";
import { db } from "~/server/db";
import { readFile } from "fs/promises";
import { join } from "path";

interface ReadinessCheck {
	name: string;
	status: "ready" | "not_ready";
	responseTime?: number;
	details?: Record<string, any>;
}

export async function GET() {
	const checks: ReadinessCheck[] = [];
	const startTime = Date.now();

	// Database connectivity check
	const dbStart = Date.now();
	try {
		await db.$queryRaw`SELECT 1`;
		checks.push({
			name: "database",
			status: "ready",
			responseTime: Date.now() - dbStart,
		});
	} catch (error) {
		checks.push({
			name: "database",
			status: "not_ready",
			responseTime: Date.now() - dbStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	// Redis connectivity check
	const redisStart = Date.now();
	if (env.REDIS_URL) {
		try {
			const { getRedisClient } = await import("~/lib/cache/redis");
			const redis = getRedisClient();
			await redis.ping();
			checks.push({
				name: "redis",
				status: "ready",
				responseTime: Date.now() - redisStart,
			});
		} catch (error) {
			checks.push({
				name: "redis",
				status: "not_ready",
				responseTime: Date.now() - redisStart,
				details: { error: error instanceof Error ? error.message : "Unknown error" },
			});
		}
	} else {
		checks.push({
			name: "redis",
			status: "ready",
			responseTime: 0,
			details: { message: "Not configured" },
		});
	}

	// Database migrations check
	const migrationStart = Date.now();
	try {
		// Check if the database has the expected tables
		const tables = await db.$queryRaw<Array<{ tablename: string }>>`
			SELECT tablename FROM pg_tables 
			WHERE schemaname = 'public' 
			AND tablename IN ('User', 'Pet', 'Kennel', 'Booking', 'Payment', 'CareLog', 'Notification', 'AuditLog')
		`;
		
		const expectedTables = ['User', 'Pet', 'Kennel', 'Booking', 'Payment', 'CareLog', 'Notification', 'AuditLog'];
		const foundTables = tables.map(t => t.tablename);
		const missingTables = expectedTables.filter(table => !foundTables.includes(table));
		
		checks.push({
			name: "migrations",
			status: missingTables.length === 0 ? "ready" : "not_ready",
			responseTime: Date.now() - migrationStart,
			details: {
				expectedTables,
				foundTables,
				missingTables,
			},
		});
	} catch (error) {
		checks.push({
			name: "migrations",
			status: "not_ready",
			responseTime: Date.now() - migrationStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	// Service Worker check
	const swStart = Date.now();
	try {
		// Check if service worker file exists
		const swPath = join(process.cwd(), "public", "sw.js");
		await readFile(swPath);
		checks.push({
			name: "serviceWorker",
			status: "ready",
			responseTime: Date.now() - swStart,
		});
	} catch (error) {
		checks.push({
			name: "serviceWorker",
			status: "not_ready",
			responseTime: Date.now() - swStart,
			details: { error: "Service worker file not found" },
		});
	}

	// Environment variables check
	const envStart = Date.now();
	const requiredEnvVars = [
		'DATABASE_URL',
		'BETTER_AUTH_SECRET',
		'ENCRYPTION_KEY',
		'STRIPE_SECRET_KEY',
		'SMTP_HOST',
		'SMTP_USER',
		'SMTP_PASS',
	];
	
	const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
	
	checks.push({
		name: "environment",
		status: missingEnvVars.length === 0 ? "ready" : "not_ready",
		responseTime: Date.now() - envStart,
		details: {
			required: requiredEnvVars,
			missing: missingEnvVars,
		},
	});

	// Critical dependencies check
	const depsStart = Date.now();
	try {
		// Check if critical dependencies are available
		await import("~/lib/auth/better-auth");
		await import("~/lib/cache/redis");
		await import("~/server/db");
		
		checks.push({
			name: "dependencies",
			status: "ready",
			responseTime: Date.now() - depsStart,
		});
	} catch (error) {
		checks.push({
			name: "dependencies",
			status: "not_ready",
			responseTime: Date.now() - depsStart,
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		});
	}

	const overallStatus = checks.every(c => c.status === "ready") ? "ready" : "not_ready";

	return Response.json(
		{
			status: overallStatus,
			version: process.env.GIT_SHA ?? "dev",
			environment: env.NODE_ENV,
			checks,
			summary: {
				totalChecks: checks.length,
				ready: checks.filter(c => c.status === "ready").length,
				notReady: checks.filter(c => c.status === "not_ready").length,
				responseTime: Date.now() - startTime,
			},
			timestamp: new Date().toISOString(),
		},
		{ status: overallStatus === "ready" ? 200 : 503 }
	);
}