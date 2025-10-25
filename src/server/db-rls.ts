import { db } from "~/server/db";

/**
 * Execute Prisma operations with Row-Level Security context
 * Sets session variables for app.user_id and app.role within transaction scope
 */
export async function withRls<T>(
	userId: string,
	role: string,
	fn: (tx: any) => Promise<T>
): Promise<T> {
	return db.$transaction(async (tx) => {
		await tx.$executeRawUnsafe(
			`SELECT set_config('app.user_id', $1, true)`,
			userId
		);
		await tx.$executeRawUnsafe(`SELECT set_config('app.role', $1, true)`, role);
		return fn(tx);
	});
}
