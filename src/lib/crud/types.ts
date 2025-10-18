import { type UserRole, type AuditAction } from "@prisma/client";
import { type Session } from "~/lib/auth/better-auth";

// Base CRUD operation types
export interface CrudOperation<T = any> {
  action: "create" | "read" | "update" | "delete";
  entity: string;
  data?: T;
  where?: any;
  include?: any;
  select?: any;
}

// Policy context for authorization
export interface PolicyContext {
  user: Session["user"];
  role: UserRole;
  customerId?: string;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

// Audit log entry
export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  target: string;
  meta?: Record<string, any>;
}

// Override event for policy bypasses
export interface OverrideEvent {
  actorId: string;
  scope: string;
  reason: string;
  entityType: string;
  entityId: string;
  approvedByAdminId?: string;
  ownerOverride?: boolean;
  metadata?: Record<string, any>;
}

// CRUD policy result
export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requiresOverride?: boolean;
  overrideScope?: string;
}

// CRUD operation result
export interface CrudResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  auditEntry?: AuditEntry;
  overrideEvent?: OverrideEvent;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Search and filter parameters
export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Entity-specific policies
export interface EntityPolicy<T = any> {
  canCreate: (context: PolicyContext, data: T) => PolicyResult;
  canRead: (context: PolicyContext, entity: T) => PolicyResult;
  canUpdate: (context: PolicyContext, entity: T, data: Partial<T>) => PolicyResult;
  canDelete: (context: PolicyContext, entity: T) => PolicyResult;
  canList: (context: PolicyContext, filters?: FilterParams) => PolicyResult;
}

// CRUD factory configuration
export interface CrudConfig<T = any> {
  entity: string;
  auditAction: AuditAction;
  policy: EntityPolicy<T>;
  redactFields?: string[];
  validateInput?: (data: any) => boolean;
  transformOutput?: (data: any, context: PolicyContext) => any;
}
