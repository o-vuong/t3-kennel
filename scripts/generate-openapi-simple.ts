import { createOpenApiDocument } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Define common schemas
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
	User: z.object({
		id: z.string(),
		email: z.string().email(),
		name: z.string(),
		role: z.enum(["CUSTOMER", "STAFF", "ADMIN", "OWNER"]),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	Pet: z.object({
		id: z.string(),
		name: z.string(),
		species: z.string(),
		breed: z.string().optional(),
		age: z.number().optional(),
		weight: z.number().optional(),
		medicalNotes: z.string().optional(),
		ownerId: z.string(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	Kennel: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().optional(),
		capacity: z.number(),
		price: z.number(),
		amenities: z.array(z.string()),
		isActive: z.boolean(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	Booking: z.object({
		id: z.string(),
		startDate: z.date(),
		endDate: z.date(),
		status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]),
		totalAmount: z.number(),
		petId: z.string(),
		kennelId: z.string(),
		customerId: z.string(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	Payment: z.object({
		id: z.string(),
		amount: z.number(),
		currency: z.string(),
		status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
		paymentMethod: z.string(),
		bookingId: z.string(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	CareLog: z.object({
		id: z.string(),
		activity: z.string(),
		notes: z.string().optional(),
		staffId: z.string(),
		bookingId: z.string(),
		createdAt: z.date(),
	}),
	Notification: z.object({
		id: z.string(),
		title: z.string(),
		message: z.string(),
		type: z.enum(["BOOKING_CONFIRMATION", "PAYMENT_SUCCESS", "REFUND_PROCESSED", "PET_CHECKED_IN", "PET_CHECKED_OUT", "CARE_LOG_UPDATE", "SYSTEM_ALERT"]),
		read: z.boolean(),
		link: z.string().optional(),
		userId: z.string(),
		createdAt: z.date(),
	}),
};

// Create a simple router for OpenAPI generation
const createTRPCRouter = () => ({
	kennels: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				kennels: z.array(commonSchemas.Kennel),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		getById: {
			_input: z.object({ id: z.string() }),
			_output: commonSchemas.Kennel,
		},
		create: {
			_input: z.object({
				name: z.string(),
				description: z.string().optional(),
				capacity: z.number(),
				price: z.number(),
				amenities: z.array(z.string()),
			}),
			_output: commonSchemas.Kennel,
		},
		update: {
			_input: z.object({
				id: z.string(),
				data: z.object({
					name: z.string().optional(),
					description: z.string().optional(),
					capacity: z.number().optional(),
					price: z.number().optional(),
					amenities: z.array(z.string()).optional(),
					isActive: z.boolean().optional(),
				}),
			}),
			_output: commonSchemas.Kennel,
		},
		delete: {
			_input: z.object({ id: z.string() }),
			_output: z.object({ success: z.boolean() }),
		},
	},
	pets: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				pets: z.array(commonSchemas.Pet),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		getById: {
			_input: z.object({ id: z.string() }),
			_output: commonSchemas.Pet,
		},
		create: {
			_input: z.object({
				name: z.string(),
				species: z.string(),
				breed: z.string().optional(),
				age: z.number().optional(),
				weight: z.number().optional(),
				medicalNotes: z.string().optional(),
			}),
			_output: commonSchemas.Pet,
		},
		update: {
			_input: z.object({
				id: z.string(),
				data: z.object({
					name: z.string().optional(),
					species: z.string().optional(),
					breed: z.string().optional(),
					age: z.number().optional(),
					weight: z.number().optional(),
					medicalNotes: z.string().optional(),
				}),
			}),
			_output: commonSchemas.Pet,
		},
		delete: {
			_input: z.object({ id: z.string() }),
			_output: z.object({ success: z.boolean() }),
		},
	},
	bookings: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				bookings: z.array(commonSchemas.Booking),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		getById: {
			_input: z.object({ id: z.string() }),
			_output: commonSchemas.Booking,
		},
		create: {
			_input: z.object({
				startDate: z.date(),
				endDate: z.date(),
				petId: z.string(),
				kennelId: z.string(),
			}),
			_output: commonSchemas.Booking,
		},
		update: {
			_input: z.object({
				id: z.string(),
				data: z.object({
					startDate: z.date().optional(),
					endDate: z.date().optional(),
					status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]).optional(),
				}),
			}),
			_output: commonSchemas.Booking,
		},
		cancel: {
			_input: z.object({ id: z.string() }),
			_output: z.object({ success: z.boolean() }),
		},
	},
	payments: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				payments: z.array(commonSchemas.Payment),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		getById: {
			_input: z.object({ id: z.string() }),
			_output: commonSchemas.Payment,
		},
		create: {
			_input: z.object({
				amount: z.number(),
				currency: z.string(),
				paymentMethod: z.string(),
				bookingId: z.string(),
			}),
			_output: commonSchemas.Payment,
		},
		refund: {
			_input: z.object({
				paymentId: z.string(),
				amount: z.number().optional(),
				reason: z.string(),
			}),
			_output: z.object({ success: z.boolean() }),
		},
	},
	careLogs: {
		list: {
			_input: z.object({
				bookingId: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
			}),
			_output: z.object({
				careLogs: z.array(commonSchemas.CareLog),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		create: {
			_input: z.object({
				activity: z.string(),
				notes: z.string().optional(),
				bookingId: z.string(),
			}),
			_output: commonSchemas.CareLog,
		},
	},
	notifications: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				notifications: z.array(commonSchemas.Notification),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		markAsRead: {
			_input: z.object({ id: z.string() }),
			_output: z.object({ success: z.boolean() }),
		},
		markAllAsRead: {
			_input: z.object({}),
			_output: z.object({ success: z.boolean() }),
		},
		clearAll: {
			_input: z.object({}),
			_output: z.object({ success: z.boolean() }),
		},
	},
	users: {
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				users: z.array(commonSchemas.User),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		getById: {
			_input: z.object({ id: z.string() }),
			_output: commonSchemas.User,
		},
		update: {
			_input: z.object({
				id: z.string(),
				data: z.object({
					name: z.string().optional(),
					role: z.enum(["CUSTOMER", "STAFF", "ADMIN", "OWNER"]).optional(),
				}),
			}),
			_output: commonSchemas.User,
		},
	},
	reports: {
		bookings: {
			_input: z.object({
				startDate: z.date(),
				endDate: z.date(),
				kennelId: z.string().optional(),
			}),
			_output: z.object({
				totalBookings: z.number(),
				totalRevenue: z.number(),
				averageBookingValue: z.number(),
				bookingsByStatus: z.record(z.number()),
			}),
		},
		revenue: {
			_input: z.object({
				startDate: z.date(),
				endDate: z.date(),
				groupBy: z.enum(["day", "week", "month"]).default("day"),
			}),
			_output: z.object({
				revenue: z.array(z.object({
					date: z.string(),
					amount: z.number(),
				})),
			}),
		},
	},
	overrides: {
		issue: {
			_input: z.object({
				userId: z.string(),
				reason: z.string(),
				expiresAt: z.date(),
			}),
			_output: z.object({ success: z.boolean() }),
		},
		list: {
			_input: commonSchemas.PaginationInput,
			_output: z.object({
				overrides: z.array(z.object({
					id: z.string(),
					userId: z.string(),
					reason: z.string(),
					expiresAt: z.date(),
					createdAt: z.date(),
				})),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
			}),
		},
		revoke: {
			_input: z.object({ id: z.string() }),
			_output: z.object({ success: z.boolean() }),
		},
	},
});

// Generate OpenAPI document
const openApiDocument = createOpenApiDocument(createTRPCRouter(), {
	title: "Kennel Management API",
	version: "1.0.0",
	description: "HIPAA-compliant kennel management system API with comprehensive pet care, booking, and payment processing capabilities.",
	serverUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	basePath: "/api/trpc",
	tags: [
		{
			name: "kennels",
			description: "Kennel management operations for managing available kennels and their amenities",
		},
		{
			name: "pets",
			description: "Pet management operations for customer pet profiles and medical information",
		},
		{
			name: "bookings",
			description: "Booking management operations for scheduling and managing pet stays",
		},
		{
			name: "payments",
			description: "Payment processing operations for handling transactions and refunds",
		},
		{
			name: "care-logs",
			description: "Pet care logging operations for tracking daily activities and health",
		},
		{
			name: "notifications",
			description: "Notification management operations for user communications",
		},
		{
			name: "users",
			description: "User management operations for staff and customer accounts",
		},
		{
			name: "reports",
			description: "Reporting and analytics operations for business insights",
		},
		{
			name: "overrides",
			description: "System override operations for emergency access and special permissions",
		},
	],
	securitySchemes: {
		BearerAuth: {
			type: "http",
			scheme: "bearer",
			bearerFormat: "JWT",
			description: "JWT token authentication",
		},
		SessionAuth: {
			type: "apiKey",
			in: "cookie",
			name: "better-auth.session_token",
			description: "Session-based authentication using cookies",
		},
	},
});

// Add common schemas to the document
openApiDocument.components = openApiDocument.components || {};
openApiDocument.components.schemas = openApiDocument.components.schemas || {};
Object.entries(commonSchemas).forEach(([name, schema]) => {
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
console.log(`Schemas defined: ${Object.keys(openApiDocument.components?.schemas || {}).length}`);
