-- Enable RLS on core tables
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CareLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OverrideEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kennel" ENABLE ROW LEVEL SECURITY;

-- Session variable accessor functions
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.role', true), '')
$$;

-- Pet policies: customers see only their own; staff/admin/owner see all
CREATE POLICY pet_policy ON "Pet"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR "ownerId" = app_current_user_id()
  )
  WITH CHECK (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR "ownerId" = app_current_user_id()
  );

-- Booking policies: similar isolation
CREATE POLICY booking_policy ON "Booking"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR "customerId" = app_current_user_id()
  )
  WITH CHECK (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR "customerId" = app_current_user_id()
  );

-- CareLog: customers read via booking relation; staff/admin/owner full access
CREATE POLICY carelog_policy ON "CareLog"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR EXISTS (
      SELECT 1 FROM "Booking" b
      WHERE b.id = "CareLog"."bookingId"
        AND b."customerId" = app_current_user_id()
    )
  )
  WITH CHECK (COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF'));

-- Notification: users see only their own
CREATE POLICY notification_policy ON "Notification"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN')
    OR "userId" = app_current_user_id()
  )
  WITH CHECK (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF')
    OR "userId" = app_current_user_id()
  );

-- ApprovalToken: issued to/by visibility
CREATE POLICY token_policy ON "ApprovalToken"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN')
    OR "issuedToUserId" = app_current_user_id()
    OR "issuedByAdminId" = app_current_user_id()
  )
  WITH CHECK (COALESCE(app_current_role(), '') IN ('OWNER','ADMIN'));

-- OverrideEvent: admin/owner full; staff see own actions
CREATE POLICY override_policy ON "OverrideEvent"
  USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN')
    OR "actorId" = app_current_user_id()
  );

-- Kennel: readable by all authenticated; write by staff+
CREATE POLICY kennel_select ON "Kennel" FOR SELECT USING (true);
CREATE POLICY kennel_write ON "Kennel" FOR ALL
  USING (COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF'))
  WITH CHECK (COALESCE(app_current_role(), '') IN ('OWNER','ADMIN','STAFF'));

-- AuditLog: append-only, readable by admin/owner and self
CREATE POLICY auditlog_select ON "AuditLog"
  FOR SELECT USING (
    COALESCE(app_current_role(), '') IN ('OWNER','ADMIN')
    OR "actorId" = app_current_user_id()
  );
REVOKE UPDATE, DELETE ON "AuditLog" FROM PUBLIC;

-- Exclusion constraint for booking overlap prevention
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "timeRange" tstzrange 
  GENERATED ALWAYS AS (tstzrange("startDate","endDate",'[)')) STORED;

CREATE INDEX IF NOT EXISTS booking_time_range_gist 
  ON "Booking" USING gist ("kennelId", "timeRange");

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist
  ("kennelId" WITH =, "timeRange" WITH &&);
