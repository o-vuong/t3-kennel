import { PrismaClient } from "@prisma/client";

import { env } from "~/env";
import { createQueryMonitor } from "~/lib/performance/query-monitor";

const createPrismaClient = () => {
	const client = new PrismaClient({
		log:
			env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
	
	// Add query monitoring
	createQueryMonitor(client);
	
	return client;
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
