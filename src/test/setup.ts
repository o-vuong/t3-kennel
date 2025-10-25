import { beforeAll, afterAll, beforeEach } from "vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-32-characters-long";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "http://localhost:3001";
process.env.TEST_DATABASE_URL = "postgresql://test:test@localhost:5432/kennel_test";

// Mock required environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/kennel_test";
process.env.STRIPE_SECRET_KEY = "sk_test_mock_stripe_secret_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock_webhook_secret";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-characters-long";
process.env.OVERRIDE_HMAC_SECRET = "test-override-hmac-secret-32-chars";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mock_stripe_publishable_key";

// Skip database setup for unit tests
beforeAll(async () => {
	// Only setup database for integration tests
	if (process.env.TEST_TYPE === "integration") {
		const { PrismaClient } = await import("@prisma/client");
		const testDb = new PrismaClient({
			datasources: {
				db: {
					url: process.env.TEST_DATABASE_URL,
				},
			},
		});
		await testDb.$connect();
	}
});

beforeEach(async () => {
	// Only clean up for integration tests
	if (process.env.TEST_TYPE === "integration") {
		// Database cleanup would go here
	}
});

afterAll(async () => {
	// Only cleanup for integration tests
	if (process.env.TEST_TYPE === "integration") {
		// Database cleanup would go here
	}
});
