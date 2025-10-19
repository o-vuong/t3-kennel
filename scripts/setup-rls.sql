-- PostgreSQL Row-Level Security (RLS) Setup Script
-- Run this script against your database to enable RLS policies
-- Usage: psql -d kennel_db -f scripts/setup-rls.sql

-- Enable Row-Level Security on core tables
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CareLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OverrideEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kennel" ENABLE ROW LEVEL SECURITY;

-- Helper functions to read session variables
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.user_id', true);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.role', true);
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policies for User table
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (
    id = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON "User";
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (
    id = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Admins can create users" ON "User";
CREATE POLICY "Admins can create users" ON "User"
  FOR INSERT WITH CHECK (
    app_current_role() IN ('ADMIN', 'OWNER')
  );

-- RLS Policies for Account table (OAuth/auth accounts)
DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Users can manage own accounts" ON "Account";
CREATE POLICY "Users can manage own accounts" ON "Account"
  FOR ALL USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'OWNER')
  );

-- RLS Policies for Session table
DROP POLICY IF EXISTS "Users can view own sessions" ON "Session";
CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Users can manage own sessions" ON "Session";
CREATE POLICY "Users can manage own sessions" ON "Session"
  FOR ALL USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'OWNER')
  );

-- RLS Policies for VerificationToken table
DROP POLICY IF EXISTS "Admins can manage verification tokens" ON "VerificationToken";
CREATE POLICY "Admins can manage verification tokens" ON "VerificationToken"
  FOR ALL USING (
    app_current_role() IN ('ADMIN', 'OWNER')
  );

-- RLS Policies for Pet table
DROP POLICY IF EXISTS "Pet owners can view own pets" ON "Pet";
CREATE POLICY "Pet owners can view own pets" ON "Pet"
  FOR SELECT USING (
    "ownerId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Pet owners can manage own pets" ON "Pet";
CREATE POLICY "Pet owners can manage own pets" ON "Pet"
  FOR ALL USING (
    "ownerId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for Booking table
DROP POLICY IF EXISTS "Booking owners can view own bookings" ON "Booking";
CREATE POLICY "Booking owners can view own bookings" ON "Booking"
  FOR SELECT USING (
    "customerId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Booking owners can create own bookings" ON "Booking";
CREATE POLICY "Booking owners can create own bookings" ON "Booking"
  FOR INSERT WITH CHECK (
    "customerId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Booking owners can update own bookings" ON "Booking";
CREATE POLICY "Booking owners can update own bookings" ON "Booking"
  FOR UPDATE USING (
    "customerId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Staff can delete bookings" ON "Booking";
CREATE POLICY "Staff can delete bookings" ON "Booking"
  FOR DELETE USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for CareLog table
DROP POLICY IF EXISTS "Care log visibility by booking ownership" ON "CareLog";
CREATE POLICY "Care log visibility by booking ownership" ON "CareLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Booking" b
      JOIN "Pet" p ON p.id = b."petId"
      WHERE b.id = "CareLog"."bookingId" 
      AND (p."ownerId" = app_current_user_id() OR app_current_role() IN ('ADMIN', 'STAFF', 'OWNER'))
    )
  );

DROP POLICY IF EXISTS "Staff can create care logs" ON "CareLog";
CREATE POLICY "Staff can create care logs" ON "CareLog"
  FOR INSERT WITH CHECK (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Staff can update care logs" ON "CareLog";
CREATE POLICY "Staff can update care logs" ON "CareLog"
  FOR UPDATE USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for Notification table
DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "System can create notifications" ON "Notification";
CREATE POLICY "System can create notifications" ON "Notification"
  FOR INSERT WITH CHECK (
    app_current_role() IN ('ADMIN', 'STAFF', 'SYSTEM', 'OWNER')
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE USING (
    "userId" = app_current_user_id() OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for ApprovalToken table
DROP POLICY IF EXISTS "Staff can manage approval tokens" ON "ApprovalToken";
CREATE POLICY "Staff can manage approval tokens" ON "ApprovalToken"
  FOR ALL USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for OverrideEvent table
DROP POLICY IF EXISTS "Staff can view override events" ON "OverrideEvent";
CREATE POLICY "Staff can view override events" ON "OverrideEvent"
  FOR SELECT USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Staff can create override events" ON "OverrideEvent";
CREATE POLICY "Staff can create override events" ON "OverrideEvent"
  FOR INSERT WITH CHECK (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- RLS Policies for AuditLog table (append-only)
DROP POLICY IF EXISTS "Staff can view audit logs" ON "AuditLog";
CREATE POLICY "Staff can view audit logs" ON "AuditLog"
  FOR SELECT USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER') OR
    "actorId" = app_current_user_id()
  );

DROP POLICY IF EXISTS "System can create audit logs" ON "AuditLog";
CREATE POLICY "System can create audit logs" ON "AuditLog"
  FOR INSERT WITH CHECK (
    app_current_role() IN ('ADMIN', 'STAFF', 'SYSTEM', 'OWNER')
  );

-- Revoke UPDATE and DELETE on AuditLog to enforce append-only
REVOKE UPDATE ON "AuditLog" FROM PUBLIC;
REVOKE DELETE ON "AuditLog" FROM PUBLIC;

-- RLS Policies for Kennel table
DROP POLICY IF EXISTS "Staff can manage kennels" ON "Kennel";
CREATE POLICY "Staff can manage kennels" ON "Kennel"
  FOR ALL USING (
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

DROP POLICY IF EXISTS "Customers can view active kennels" ON "Kennel";
CREATE POLICY "Customers can view active kennels" ON "Kennel"
  FOR SELECT USING (
    "isActive" = true OR 
    app_current_role() IN ('ADMIN', 'STAFF', 'OWNER')
  );

-- Add exclusion constraint to prevent overlapping bookings
-- First, create the btree_gist extension if not exists
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint for booking time conflicts (with error handling)
DO $$
BEGIN
  BEGIN
    ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap 
      EXCLUDE USING gist (
        "kennelId" WITH =, 
        tstzrange("startDate", "endDate") WITH &&
      ) 
      WHERE (status IN ('CONFIRMED', 'CHECKED_IN'));
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Constraint booking_no_overlap already exists, skipping...';
  END;
END $$;

-- Create indexes for RLS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_owner_id ON "Pet"("ownerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_customer_id ON "Booking"("customerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_kennel_id ON "Booking"("kennelId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_log_booking_id ON "CareLog"("bookingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user_id ON "Notification"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_time_range ON "Booking" USING gist (tstzrange("startDate", "endDate"));

-- Print status
DO $$
BEGIN
  RAISE NOTICE 'Row-Level Security policies have been successfully applied!';
  RAISE NOTICE 'RLS is now enabled on all core tables with proper access controls.';
END $$;