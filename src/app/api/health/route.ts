import { db } from "~/server/db";
import { env } from "~/env";

export async function GET() {
	const checks = {
		database: false,
		redis: false,
		vapid: false,
		smtp: false,
	};

	try {
		await db.$queryRaw`SELECT 1`;
		checks.database = true;
	} catch {
		// Database check failed
	}

	// Check Redis if configured
	if (env.REDIS_URL) {
		try {
			// TODO: Add Redis health check when Redis is implemented in Phase 5
			checks.redis = true;
		} catch {
			// Redis check failed
		}
	} else {
		checks.redis = true; // Not configured, consider healthy
	}

	checks.vapid = !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
	checks.smtp = !!(env.SMTP_HOST && env.SMTP_USER);

	const healthy = checks.database;

	return Response.json(
		{
			status: healthy ? "healthy" : "unhealthy",
			version: process.env.GIT_SHA ?? "dev",
			checks,
			timestamp: new Date().toISOString(),
		},
		{ status: healthy ? 200 : 503 },
	);
}