import { createOpenApiDocument } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { kennelsRouter } from "~/server/api/routers/kennels";
import { petsRouter } from "~/server/api/routers/pets";
import { bookingsRouter } from "~/server/api/routers/bookings";
import { paymentsRouter } from "~/server/api/routers/payments";
import { careLogsRouter } from "~/server/api/routers/care-logs";
import { notificationsRouter } from "~/server/api/routers/notifications";
import { usersRouter } from "~/server/api/routers/users";
import { reportsRouter } from "~/server/api/routers/reports";
import { overridesRouter } from "~/server/api/routers/overrides";

// Create the main app router
const appRouter = createTRPCRouter({
	kennels: kennelsRouter,
	pets: petsRouter,
	bookings: bookingsRouter,
	payments: paymentsRouter,
	careLogs: careLogsRouter,
	notifications: notificationsRouter,
	users: usersRouter,
	reports: reportsRouter,
	overrides: overridesRouter,
});

// Generate OpenAPI document
const openApiDocument = createOpenApiDocument(appRouter, {
	title: "Kennel Management API",
	version: "1.0.0",
	description: "HIPAA-compliant kennel management system API",
	serverUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	basePath: "/api/trpc",
	tags: [
		{
			name: "kennels",
			description: "Kennel management operations",
		},
		{
			name: "pets",
			description: "Pet management operations",
		},
		{
			name: "bookings",
			description: "Booking management operations",
		},
		{
			name: "payments",
			description: "Payment processing operations",
		},
		{
			name: "care-logs",
			description: "Pet care logging operations",
		},
		{
			name: "notifications",
			description: "Notification management operations",
		},
		{
			name: "users",
			description: "User management operations",
		},
		{
			name: "reports",
			description: "Reporting and analytics operations",
		},
		{
			name: "overrides",
			description: "System override operations",
		},
	],
	securitySchemes: {
		BearerAuth: {
			type: "http",
			scheme: "bearer",
			bearerFormat: "JWT",
		},
		SessionAuth: {
			type: "apiKey",
			in: "cookie",
			name: "better-auth.session_token",
		},
	},
});

// Add common schemas
const commonSchemas = {
	Error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.record(z.any()).optional(),
	}),
	PaginationInput: z.object({
		page: z.number().min(1).default(1),
		limit: z.number().min(1).max(100).default(20),
	}),
	PaginationOutput: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
	SuccessResponse: z.object({
		success: z.boolean(),
		message: z.string().optional(),
	}),
};

// Add schemas to the document
Object.entries(commonSchemas).forEach(([name, schema]) => {
	openApiDocument.components = openApiDocument.components || {};
	openApiDocument.components.schemas = openApiDocument.components.schemas || {};
	openApiDocument.components.schemas[name] = schema;
});

// Add example responses
const exampleResponses = {
	"400": {
		description: "Bad Request",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "BAD_REQUEST",
					message: "Invalid input parameters",
					details: {
						field: "email",
						reason: "Invalid email format",
					},
				},
			},
		},
	},
	"401": {
		description: "Unauthorized",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "UNAUTHORIZED",
					message: "Authentication required",
				},
			},
		},
	},
	"403": {
		description: "Forbidden",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "FORBIDDEN",
					message: "Insufficient permissions",
				},
			},
		},
	},
	"404": {
		description: "Not Found",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "NOT_FOUND",
					message: "Resource not found",
				},
			},
		},
	},
	"429": {
		description: "Too Many Requests",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "TOO_MANY_REQUESTS",
					message: "Rate limit exceeded",
				},
			},
		},
	},
	"500": {
		description: "Internal Server Error",
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/Error",
				},
				example: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred",
				},
			},
		},
	},
};

// Add common responses to all paths
Object.values(openApiDocument.paths || {}).forEach((pathItem) => {
	Object.values(pathItem).forEach((operation) => {
		if (operation && typeof operation === "object" && "responses" in operation) {
			Object.entries(exampleResponses).forEach(([code, response]) => {
				operation.responses = operation.responses || {};
				operation.responses[code] = response;
			});
		}
	});
});

// Add security requirements
Object.values(openApiDocument.paths || {}).forEach((pathItem) => {
	Object.values(pathItem).forEach((operation) => {
		if (operation && typeof operation === "object") {
			// Add security for protected routes
			if (operation.tags?.some(tag => 
				["kennels", "pets", "bookings", "payments", "care-logs", "notifications", "users", "reports", "overrides"].includes(tag)
			)) {
				operation.security = [
					{ BearerAuth: [] },
					{ SessionAuth: [] },
				];
			}
		}
	});
});

// Write the OpenAPI document to a file
import { writeFileSync } from "fs";
import { join } from "path";

const outputPath = join(process.cwd(), "docs", "openapi.json");
writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI specification generated at: ${outputPath}`);
console.log(`Document contains ${Object.keys(openApiDocument.paths || {}).length} paths`);
