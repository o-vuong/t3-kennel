/**
 * Row-Level Security (RLS) utilities for PostgreSQL
 * 
 * This module provides middleware to enforce RLS policies by setting session variables
 * that are used by PostgreSQL RLS policies to control data access.
 */

import { type PrismaClient, type Prisma } from "@prisma/client";
import { db } from "~/server/db";

/**
 * Execute a function within an RLS transaction scope
 * 
 * This function sets the current user ID and role as PostgreSQL session variables
 * within a transaction, ensuring RLS policies can enforce proper access control.
 * 
 * @param userId - The current user's ID
 * @param role - The current user's role (ADMIN, STAFF, CUSTOMER)
 * @param fn - Function to execute with RLS context set
 * @returns Promise resolving to the function's result
 */
export async function withRls<T>(
  userId: string,
  role: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    // Set session variables for RLS policies
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.user_id', $1, true)`,
      userId
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.role', $1, true)`,
      role.toUpperCase()
    );
    
    // Execute the function with RLS context
    return fn(tx);
  });
}

/**
 * Execute a function as system/admin with elevated privileges
 * 
 * @param fn - Function to execute with system context
 * @returns Promise resolving to the function's result
 */
export async function withSystemRole<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.user_id', 'system', true)`
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.role', 'SYSTEM', true)`
    );
    
    return fn(tx);
  });
}

/**
 * Verify that RLS is enabled on critical tables
 * 
 * @returns Promise<boolean> - true if RLS is properly configured
 */
export async function verifyRlsEnabled(): Promise<boolean> {
  const result = await db.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    JOIN pg_class ON tablename = relname
    WHERE schemaname = 'public' 
    AND tablename IN ('User', 'Pet', 'Booking', 'CareLog', 'Notification', 'ApprovalToken', 'OverrideEvent', 'AuditLog', 'Kennel')
    ORDER BY tablename;
  `;

  const criticalTables = ['User', 'Pet', 'Booking', 'CareLog', 'Notification', 'ApprovalToken', 'OverrideEvent', 'AuditLog', 'Kennel'];
  const enabledTables = result.filter(table => table.rowsecurity).map(table => table.tablename);
  
  return criticalTables.every(table => enabledTables.includes(table));
}

/**
 * Get current session context (for debugging/logging)
 * 
 * @returns Promise with current user ID and role from session
 */
export async function getCurrentRlsContext(): Promise<{
  userId: string | null;
  role: string | null;
}> {
  const [userResult, roleResult] = await Promise.all([
    db.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.user_id', true) as current_setting`,
    db.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.role', true) as current_setting`
  ]);

  return {
    userId: userResult[0]?.current_setting || null,
    role: roleResult[0]?.current_setting || null,
  };
}

/**
 * Type guard to check if a user has admin or staff privileges
 */
export function hasElevatedRole(role: string): boolean {
  return ['ADMIN', 'STAFF', 'OWNER'].includes(role.toUpperCase());
}

/**
 * Type guard to check if a user can access another user's data
 */
export function canAccessUserData(currentUserId: string, targetUserId: string, role: string): boolean {
  return currentUserId === targetUserId || hasElevatedRole(role);
}