import type { AuditAction, PrismaClient } from "@prisma/client";
import type { Session } from "~/lib/auth/better-auth";
import { withRls } from "~/server/db-rls";
import { createPolicyContext } from "./policy";
import type {
	AuditEntry,
	CrudResult,
	EntityPolicy,
	FilterParams,
	OverrideEvent,
	PaginationParams,
	PolicyContext,
} from "./types";

/**
 * DRY CRUD Factory with HIPAA-compliant audit logging and role-based access control
 */
type CrudAction = "create" | "read" | "update" | "delete";

export class CrudFactory {
	constructor(
		private db: PrismaClient,
		private entity: string,
		private auditAction: AuditAction,
		private policy: EntityPolicy,
		private redactFields: string[] = [],
		private validateInput?: (data: any) => boolean,
		private transformOutput?: (data: any, context: PolicyContext) => any,
		private auditActionMap?: Partial<Record<CrudAction, AuditAction>>
	) {}

	private resolveAuditAction(operation: CrudAction) {
		return this.auditActionMap?.[operation] ?? this.auditAction;
	}

	/**
	 * Create a new entity with audit logging
	 */
	async create<T>(
		session: Session,
		data: T,
		overrideToken?: string
	): Promise<CrudResult<T>> {
		try {
			const context = createPolicyContext(session.user);

			// Validate input
			if (this.validateInput && !this.validateInput(data)) {
				return { success: false, error: "Invalid input data" };
			}

			// Check permissions
			const permission = this.policy.canCreate(context, data);
			if (!permission.allowed) {
				// Check for override token if required
				if (permission.requiresOverride && overrideToken) {
					const overrideValid = await this.validateOverrideToken(
						session.user.id,
						overrideToken,
						permission.overrideScope!
					);
					if (!overrideValid) {
						return { success: false, error: "Invalid override token" };
					}
				} else {
					return { success: false, error: permission.reason };
				}
			}

			// Create entity with RLS context
			const entity = await withRls(
				session.user.id,
				session.user.role,
				async (tx) => {
					return (tx as any)[this.entity].create({
						data: {
							...data,
							// Add creator information if applicable
							...(this.entity === "booking" && {
								creatorId: session.user.id,
								customerId: (data as any).customerId || session.user.id,
							}),
						},
						include: this.getDefaultInclude(),
					});
				}
			);

			// Create audit entry
			const auditEntry: AuditEntry = {
				actorId: session.user.id,
				action: this.resolveAuditAction("create"),
				target: `${this.entity}:${entity.id}`,
				meta: {
					action: "create",
					data: this.redactSensitiveData(data),
					timestamp: new Date().toISOString(),
				},
			};

			await withRls(session.user.id, session.user.role, async (tx) => {
				return tx.auditLog.create({
					data: auditEntry,
				});
			});

			// Create override event if applicable
			let overrideEvent: OverrideEvent | undefined;
			if (overrideToken && permission.requiresOverride) {
				overrideEvent = {
					actorId: session.user.id,
					scope: permission.overrideScope! as any,
					reason: "Policy override for entity creation",
					entityType: this.entity,
					entityId: entity.id,
					metadata: { overrideToken },
				};

				await withRls(session.user.id, session.user.role, async (tx) => {
					return tx.overrideEvent.create({
						data: overrideEvent as any,
					});
				});
			}

			return {
				success: true,
				data: this.transformOutput
					? this.transformOutput(entity, context)
					: entity,
				auditEntry,
				overrideEvent,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Read a single entity with access control
	 */
	async read<T>(session: Session, id: string): Promise<CrudResult<T>> {
		try {
			const context = createPolicyContext(session.user);

			// Find entity with RLS context
			const entity = await withRls(
				session.user.id,
				session.user.role,
				async (tx) => {
					return (tx as any)[this.entity].findUnique({
						where: { id },
						include: this.getDefaultInclude(),
					});
				}
			);

			if (!entity) {
				return { success: false, error: "Entity not found" };
			}

			// Check permissions
			const permission = this.policy.canRead(context, entity);
			if (!permission.allowed) {
				return { success: false, error: permission.reason };
			}

			// Create audit entry
			const auditEntry: AuditEntry = {
				actorId: session.user.id,
				action: this.resolveAuditAction("read"),
				target: `${this.entity}:${entity.id}`,
				meta: {
					action: "read",
					timestamp: new Date().toISOString(),
				},
			};

			await withRls(session.user.id, session.user.role, async (tx) => {
				return tx.auditLog.create({
					data: auditEntry,
				});
			});

			return {
				success: true,
				data: this.transformOutput
					? this.transformOutput(entity, context)
					: entity,
				auditEntry,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Update an entity with audit logging
	 */
	async update<T>(
		session: Session,
		id: string,
		data: Partial<T>,
		overrideToken?: string
	): Promise<CrudResult<T>> {
		try {
			const context = createPolicyContext(session.user);

			// Find existing entity
			const existingEntity = await (this.db as any)[this.entity].findUnique({
				where: { id },
			});

			if (!existingEntity) {
				return { success: false, error: "Entity not found" };
			}

			// Validate input
			if (this.validateInput && !this.validateInput(data)) {
				return { success: false, error: "Invalid input data" };
			}

			// Check permissions
			const permission = this.policy.canUpdate(context, existingEntity, data);
			if (!permission.allowed) {
				// Check for override token if required
				if (permission.requiresOverride && overrideToken) {
					const overrideValid = await this.validateOverrideToken(
						session.user.id,
						overrideToken,
						permission.overrideScope!
					);
					if (!overrideValid) {
						return { success: false, error: "Invalid override token" };
					}
				} else {
					return { success: false, error: permission.reason };
				}
			}

			// Update entity with RLS context
			const entity = await withRls(
				session.user.id,
				session.user.role,
				async (tx) => {
					return (tx as any)[this.entity].update({
						where: { id },
						data,
						include: this.getDefaultInclude(),
					});
				}
			);

			// Create audit entry
			const auditEntry: AuditEntry = {
				actorId: session.user.id,
				action: this.resolveAuditAction("update"),
				target: `${this.entity}:${entity.id}`,
				meta: {
					action: "update",
					changes: this.redactSensitiveData(data),
					previous: this.redactSensitiveData(existingEntity),
					timestamp: new Date().toISOString(),
				},
			};

			await withRls(session.user.id, session.user.role, async (tx) => {
				return tx.auditLog.create({
					data: auditEntry,
				});
			});

			// Create override event if applicable
			let overrideEvent: OverrideEvent | undefined;
			if (overrideToken && permission.requiresOverride) {
				overrideEvent = {
					actorId: session.user.id,
					scope: permission.overrideScope! as any,
					reason: "Policy override for entity update",
					entityType: this.entity,
					entityId: entity.id,
					metadata: { overrideToken },
				};

				await withRls(session.user.id, session.user.role, async (tx) => {
					return tx.overrideEvent.create({
						data: overrideEvent as any,
					});
				});
			}

			return {
				success: true,
				data: this.transformOutput
					? this.transformOutput(entity, context)
					: entity,
				auditEntry,
				overrideEvent,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Delete an entity with audit logging
	 */
	async delete<T>(
		session: Session,
		id: string,
		overrideToken?: string
	): Promise<CrudResult<T>> {
		try {
			const context = createPolicyContext(session.user);

			// Find existing entity
			const existingEntity = await (this.db as any)[this.entity].findUnique({
				where: { id },
			});

			if (!existingEntity) {
				return { success: false, error: "Entity not found" };
			}

			// Check permissions
			const permission = this.policy.canDelete(context, existingEntity);
			if (!permission.allowed) {
				// Check for override token if required
				if (permission.requiresOverride && overrideToken) {
					const overrideValid = await this.validateOverrideToken(
						session.user.id,
						overrideToken,
						permission.overrideScope!
					);
					if (!overrideValid) {
						return { success: false, error: "Invalid override token" };
					}
				} else {
					return { success: false, error: permission.reason };
				}
			}

			// Delete entity with RLS context
			await withRls(session.user.id, session.user.role, async (tx) => {
				return (tx as any)[this.entity].delete({
					where: { id },
				});
			});

			// Create audit entry
			const auditEntry: AuditEntry = {
				actorId: session.user.id,
				action: this.resolveAuditAction("delete"),
				target: `${this.entity}:${id}`,
				meta: {
					action: "delete",
					deletedData: this.redactSensitiveData(existingEntity),
					timestamp: new Date().toISOString(),
				},
			};

			await withRls(session.user.id, session.user.role, async (tx) => {
				return tx.auditLog.create({
					data: auditEntry,
				});
			});

			// Create override event if applicable
			let overrideEvent: OverrideEvent | undefined;
			if (overrideToken && permission.requiresOverride) {
				overrideEvent = {
					actorId: session.user.id,
					scope: permission.overrideScope! as any,
					reason: "Policy override for entity deletion",
					entityType: this.entity,
					entityId: id,
					metadata: { overrideToken },
				};

				await withRls(session.user.id, session.user.role, async (tx) => {
					return tx.overrideEvent.create({
						data: overrideEvent as any,
					});
				});
			}

			return {
				success: true,
				auditEntry,
				overrideEvent,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * List entities with filtering and pagination
	 */
	async list<T>(
		session: Session,
		filters?: FilterParams,
		pagination?: PaginationParams
	): Promise<
		CrudResult<{ items: T[]; total: number; page: number; limit: number }>
	> {
		try {
			const context = createPolicyContext(session.user);

			// Check permissions
			const permission = this.policy.canList(context, filters);
			if (!permission.allowed) {
				return { success: false, error: permission.reason };
			}

			const page = pagination?.page || 1;
			const limit = Math.min(pagination?.limit || 20, 100); // Max 100 items per page
			const skip = (page - 1) * limit;

			// Build where clause based on user role and filters
			const where = this.buildWhereClause(context, filters);

			// Get total count and items with RLS context
			const { total, items } = await withRls(
				session.user.id,
				session.user.role,
				async (tx) => {
					const total = await (tx as any)[this.entity].count({ where });
					const items = (await (tx as any)[this.entity].findMany({
						where,
						include: this.getDefaultInclude(),
						skip,
						take: limit,
						orderBy: this.getDefaultOrderBy(pagination),
					})) as T[];
					return { total, items };
				}
			);

			// Transform items if needed
			const transformedItems = this.transformOutput
				? items.map((item) => this.transformOutput?.(item, context))
				: items;

			return {
				success: true,
				data: {
					items: transformedItems,
					total,
					page,
					limit,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Validate override token
	 */
	private async validateOverrideToken(
		userId: string,
		token: string,
		scope: string
	): Promise<boolean> {
		const approvalToken = await withRls(
			userId,
			"STAFF", // Override context for token validation
			async (tx) => {
				return tx.approvalToken.findFirst({
					where: {
						token,
						scope: scope as any,
						issuedToUserId: userId,
						expiresAt: { gt: new Date() },
						usedAt: null,
						revokedAt: null,
					},
				});
			}
		);

		if (!approvalToken) {
			return false;
		}

		// Mark token as used
		await withRls(userId, "STAFF", async (tx) => {
			return tx.approvalToken.update({
				where: { id: approvalToken.id },
				data: { usedAt: new Date() },
			});
		});

		return true;
	}

	/**
	 * Redact sensitive data from audit logs
	 */
	private redactSensitiveData(data: any): any {
		if (!data || typeof data !== "object") {
			return data;
		}

		const redacted = { ...data };
		for (const field of this.redactFields) {
			if (field in redacted) {
				redacted[field] = "[REDACTED]";
			}
		}

		return redacted;
	}

	/**
	 * Build where clause based on user role and filters
	 */
	private buildWhereClause(
		context: PolicyContext,
		filters?: FilterParams
	): any {
		const where: any = {};

		// Apply role-based filtering
		if (context.isCustomer) {
			// Customers can only see their own data
			where.customerId = context.user.id;
		}

		// Apply additional filters
		if (filters?.filters) {
			Object.assign(where, filters.filters);
		}

		if (filters?.dateRange) {
			where.createdAt = {
				gte: filters.dateRange.start,
				lte: filters.dateRange.end,
			};
		}

		return where;
	}

	/**
	 * Get default include for relations
	 */
	private getDefaultInclude(): any {
		// Override in specific implementations
		return {};
	}

	/**
	 * Get default order by clause
	 */
	private getDefaultOrderBy(pagination?: PaginationParams): any {
		const sortBy = pagination?.sortBy || "createdAt";
		const sortOrder = pagination?.sortOrder || "desc";

		return { [sortBy]: sortOrder };
	}
}
