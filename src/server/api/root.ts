import { adminRouter } from "~/server/api/routers/admin";
import { bookingsRouter } from "~/server/api/routers/bookings";
import { careLogsRouter } from "~/server/api/routers/care-logs";
import { customerRouter } from "~/server/api/routers/customer";
import { kennelsRouter } from "~/server/api/routers/kennels";
import { notificationsRouter } from "~/server/api/routers/notifications";
import { ownerRouter } from "~/server/api/routers/owner";
import { paymentsRouter } from "~/server/api/routers/payments";
import { petsRouter } from "~/server/api/routers/pets";
import { staffRouter } from "~/server/api/routers/staff";
import { systemRouter } from "~/server/api/routers/system";
import { usersRouter } from "~/server/api/routers/users";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	admin: adminRouter,
	users: usersRouter,
	pets: petsRouter,
	bookings: bookingsRouter,
	careLogs: careLogsRouter,
	kennels: kennelsRouter,
	notifications: notificationsRouter,
	owner: ownerRouter,
	staff: staffRouter,
	customer: customerRouter,
	payments: paymentsRouter,
	system: systemRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.someProcedure();
 */
export const createCaller = createCallerFactory(appRouter);
