/**
 * Example usage of Row-Level Security (RLS) middleware
 * 
 * This file demonstrates how to use the RLS middleware in API routes
 * and tRPC procedures to enforce data access controls.
 */

import { withRls, withSystemRole } from "~/server/db-rls";

// Example: Using RLS in a tRPC procedure
export async function getUserPets(userId: string, role: string) {
  return withRls(userId, role, async (tx) => {
    // This query will automatically enforce RLS policies
    // Customers can only see their own pets, staff/admin can see all pets
    return tx.pet.findMany({
      where: {
        // No need to add ownerId filter here - RLS handles it automatically
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });
}

// Example: Creating a booking with RLS
export async function createBooking(
  userId: string, 
  role: string, 
  data: {
    petId: string;
    kennelId: string;
    startDate: Date;
    endDate: Date;
    customerId: string;
  }
) {
  return withRls(userId, role, async (tx) => {
    // RLS will ensure:
    // 1. Customer can only create bookings for their own pets
    // 2. Staff/admin can create bookings for anyone
    return tx.booking.create({
      data: {
        ...data,
        creatorId: userId,
        price: 100.00, // Calculate based on kennel and duration
        status: "PENDING",
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        kennel: true,
      },
    });
  });
}

// Example: Administrative operation using system role
export async function createAuditLog(
  actorId: string,
  action: string,
  target: string,
  meta?: any
) {
  return withSystemRole(async (tx) => {
    // System role bypasses RLS for audit logging
    return tx.auditLog.create({
      data: {
        actorId,
        action: action as any, // Cast to AuditAction enum
        target,
        meta,
      },
    });
  });
}

// Example: Getting user's own bookings
export async function getUserBookings(userId: string, role: string) {
  return withRls(userId, role, async (tx) => {
    return tx.booking.findMany({
      // RLS automatically filters to user's own bookings for customers
      // Staff/admin see all bookings
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        kennel: true,
        careLogs: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  });
}

// Example: Staff adding care log entry
export async function addCareLog(
  staffUserId: string,
  role: string,
  bookingId: string,
  careData: {
    type: string;
    note: string;
  }
) {
  // Ensure only staff can create care logs
  if (!['ADMIN', 'STAFF', 'OWNER'].includes(role.toUpperCase())) {
    throw new Error('Insufficient permissions to create care logs');
  }

  return withRls(staffUserId, role, async (tx) => {
    return tx.careLog.create({
      data: {
        bookingId,
        staffId: staffUserId,
        type: careData.type,
        note: careData.note,
      },
      include: {
        booking: {
          include: {
            pet: {
              include: {
                owner: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
}

// Example: Error handling with RLS
export async function getRestrictedData(userId: string, role: string) {
  try {
    return await withRls(userId, role, async (tx) => {
      // If this query would violate RLS policies, PostgreSQL will return empty results
      // or throw an error depending on the violation type
      return tx.user.findMany({
        // This would be filtered by RLS - customers see only themselves
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    });
  } catch (error) {
    console.error('RLS Policy Violation:', error);
    throw new Error('Access denied: insufficient permissions');
  }
}

// Example: Utility function for checking permissions before operations
export function canAccessUserData(currentUserId: string, targetUserId: string, role: string): boolean {
  // Customers can only access their own data
  if (role.toUpperCase() === 'CUSTOMER') {
    return currentUserId === targetUserId;
  }
  
  // Staff, admin, and owner can access any user's data
  return ['STAFF', 'ADMIN', 'OWNER'].includes(role.toUpperCase());
}