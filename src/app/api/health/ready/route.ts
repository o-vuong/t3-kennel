import { db } from "~/server/db";

export async function GET() {
	try {
		// Check if database is accessible
		await db.$queryRaw`SELECT 1`;

		// Check if required environment variables are loaded
		const requiredEnvVars = [
			"DATABASE_URL",
			"BETTER_AUTH_SECRET",
			"BETTER_AUTH_URL",
			"ENCRYPTION_KEY",
		];

		const missingEnvVars = requiredEnvVars.filter(
			(envVar) => !process.env[envVar]
		);

		if (missingEnvVars.length > 0) {
			return Response.json(
				{
					ready: false,
					reason: `Missing environment variables: ${missingEnvVars.join(", ")}`,
					timestamp: new Date().toISOString(),
				},
				{ status: 503 }
			);
		}

		// TODO: Add migration check when migrations are implemented
		// TODO: Add service worker build check

		return Response.json(
			{
				ready: true,
				timestamp: new Date().toISOString(),
			},
			{ status: 200 }
		);
	} catch (error) {
		return Response.json(
			{
				ready: false,
				reason: "Database connection failed",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 503 }
		);
	}
}
