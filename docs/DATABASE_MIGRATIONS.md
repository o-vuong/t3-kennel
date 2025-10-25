# Database Migration Guide

This document provides comprehensive procedures for managing database migrations in the Kennel Management System.

## Table of Contents

1. [Overview](#overview)
2. [Migration Types](#migration-types)
3. [Creating Migrations](#creating-migrations)
4. [Applying Migrations](#applying-migrations)
5. [Rolling Back Migrations](#rolling-back-migrations)
6. [Production Migrations](#production-migrations)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

The Kennel Management System uses Prisma ORM for database management with PostgreSQL as the primary database. Migrations are managed through Prisma's migration system, which provides:

- **Version Control**: Track database schema changes
- **Rollback Support**: Revert changes when needed
- **Production Safety**: Safe deployment procedures
- **Data Integrity**: Maintain referential integrity

## Migration Types

### 1. Schema Changes

- **Table Creation**: New tables and relationships
- **Column Changes**: Add, modify, or remove columns
- **Index Changes**: Add or remove database indexes
- **Constraint Changes**: Foreign keys, unique constraints, etc.

### 2. Data Migrations

- **Data Transformation**: Convert existing data formats
- **Data Seeding**: Insert initial or reference data
- **Data Cleanup**: Remove obsolete or invalid data
- **Data Validation**: Ensure data integrity

### 3. Performance Migrations

- **Index Optimization**: Improve query performance
- **Partitioning**: Split large tables for better performance
- **Archiving**: Move old data to archive tables

## Creating Migrations

### 1. Development Workflow

```bash
# 1. Make changes to schema.prisma
nano prisma/schema.prisma

# 2. Generate migration
pnpm db:generate

# 3. Review generated migration
cat prisma/migrations/$(ls -t prisma/migrations/ | head -1)/migration.sql

# 4. Apply migration to development database
pnpm db:migrate

# 5. Test the changes
pnpm test
```

### 2. Schema Changes

#### Adding a New Table

```prisma
// prisma/schema.prisma
model NewTable {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Adding a Column

```prisma
// prisma/schema.prisma
model ExistingTable {
  id        String   @id @default(cuid())
  name      String
  newField  String?  // New optional field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Adding a Relationship

```prisma
// prisma/schema.prisma
model User {
  id    String @id @default(cuid())
  name  String
  pets  Pet[]  // New relationship
}

model Pet {
  id     String @id @default(cuid())
  name   String
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

### 3. Data Migrations

#### Custom Data Migration

```typescript
// prisma/migrations/YYYYMMDD_HHMMSS_custom_migration/migration.sql
-- Custom data transformation
UPDATE "User" SET "role" = 'CUSTOMER' WHERE "role" IS NULL;

-- Add new column with default value
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Update existing records
UPDATE "User" SET "isActive" = true WHERE "isActive" IS NULL;
```

#### Seeding Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed initial data
  await prisma.kennel.createMany({
    data: [
      {
        name: 'Standard Kennel',
        capacity: 1,
        price: 5000, // $50.00 in cents
        amenities: ['Food', 'Water', 'Exercise'],
        isActive: true,
      },
      {
        name: 'Premium Kennel',
        capacity: 1,
        price: 7500, // $75.00 in cents
        amenities: ['Food', 'Water', 'Exercise', 'Grooming', 'Playtime'],
        isActive: true,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Applying Migrations

### 1. Development Environment

```bash
# Apply all pending migrations
pnpm db:migrate

# Apply specific migration
pnpm db:migrate --target MIGRATION_NAME

# Check migration status
pnpm db:migrate status
```

### 2. Staging Environment

```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Apply migrations
docker-compose -f docker-compose.staging.yml exec app pnpm db:migrate

# Verify changes
docker-compose -f docker-compose.staging.yml exec app pnpm db:studio
```

### 3. Production Environment

```bash
# Pre-migration backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U kennel_user kennel_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate

# Verify migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Test application
curl https://your-domain.com/api/health
```

## Rolling Back Migrations

### 1. Development Rollback

```bash
# List migration history
pnpm db:migrate status

# Rollback last migration
pnpm db:migrate rollback

# Rollback to specific migration
pnpm db:migrate rollback --target MIGRATION_NAME
```

### 2. Production Rollback

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Rollback migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate rollback

# Restart application
docker-compose -f docker-compose.prod.yml start app

# Verify rollback
curl https://your-domain.com/api/health
```

### 3. Emergency Rollback

```bash
# Restore from backup
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U kennel_user kennel_prod < backup_YYYYMMDD_HHMMSS.sql

# Restart application
docker-compose -f docker-compose.prod.yml restart app
```

## Production Migrations

### 1. Pre-Migration Checklist

- [ ] **Backup Database**: Create full database backup
- [ ] **Test in Staging**: Verify migration in staging environment
- [ ] **Review Migration**: Check generated SQL for issues
- [ ] **Plan Rollback**: Prepare rollback procedure
- [ ] **Notify Team**: Inform team of migration schedule
- [ ] **Monitor System**: Ensure system is stable

### 2. Migration Procedure

```bash
# 1. Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U kennel_user kennel_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate

# 3. Verify migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# 4. Test application
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/ready

# 5. Monitor system
docker-compose -f docker-compose.prod.yml logs -f app
```

### 3. Post-Migration Verification

```bash
# Check migration status
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Verify database schema
docker-compose -f docker-compose.prod.yml exec app pnpm db:studio

# Test critical functionality
# - User authentication
# - Pet registration
# - Booking creation
# - Payment processing

# Check application metrics
curl https://your-domain.com/api/metrics
```

## Troubleshooting

### 1. Migration Failures

#### Common Issues

```bash
# Check migration status
pnpm db:migrate status

# View migration history
ls -la prisma/migrations/

# Check database connection
pnpm db:studio
```

#### Resolution Steps

```bash
# 1. Check error logs
docker-compose -f docker-compose.prod.yml logs app

# 2. Verify database connection
docker-compose -f docker-compose.prod.yml exec db pg_isready

# 3. Check migration files
cat prisma/migrations/$(ls -t prisma/migrations/ | head -1)/migration.sql

# 4. Manual migration (if needed)
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM _prisma_migrations;"
```

### 2. Data Integrity Issues

#### Check Data Consistency

```sql
-- Check for orphaned records
SELECT * FROM "Pet" WHERE "ownerId" NOT IN (SELECT "id" FROM "User");

-- Check for missing foreign keys
SELECT * FROM "Booking" WHERE "petId" NOT IN (SELECT "id" FROM "Pet");

-- Check for invalid data
SELECT * FROM "User" WHERE "email" IS NULL OR "email" = '';
```

#### Fix Data Issues

```sql
-- Remove orphaned records
DELETE FROM "Pet" WHERE "ownerId" NOT IN (SELECT "id" FROM "User");

-- Update invalid data
UPDATE "User" SET "email" = 'unknown@example.com' WHERE "email" IS NULL OR "email" = '';

-- Add missing foreign keys
UPDATE "Booking" SET "petId" = (SELECT "id" FROM "Pet" LIMIT 1) WHERE "petId" NOT IN (SELECT "id" FROM "Pet");
```

### 3. Performance Issues

#### Check Migration Performance

```bash
# Monitor migration execution
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate --verbose

# Check database locks
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_locks;"

# Monitor system resources
htop
```

#### Optimize Migrations

```sql
-- Add indexes for large tables
CREATE INDEX CONCURRENTLY "idx_booking_created_at" ON "Booking" ("createdAt");

-- Use CONCURRENTLY for non-blocking operations
CREATE INDEX CONCURRENTLY "idx_user_email" ON "User" ("email");

-- Analyze table statistics
ANALYZE "User";
ANALYZE "Pet";
ANALYZE "Booking";
```

## Best Practices

### 1. Migration Design

- **Atomic Operations**: Each migration should be atomic
- **Backward Compatibility**: Maintain backward compatibility when possible
- **Data Validation**: Validate data before and after migration
- **Performance**: Consider migration performance impact

### 2. Testing Migrations

```bash
# Test migration in development
pnpm db:migrate

# Test rollback
pnpm db:migrate rollback
pnpm db:migrate

# Test with sample data
pnpm db:seed
pnpm test
```

### 3. Documentation

- **Migration Purpose**: Document why the migration is needed
- **Data Impact**: Document any data changes
- **Rollback Plan**: Document rollback procedures
- **Testing**: Document testing procedures

### 4. Monitoring

```bash
# Monitor migration progress
docker-compose -f docker-compose.prod.yml logs -f app

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_activity;"

# Monitor system resources
htop
iotop
```

### 5. Security

- **Access Control**: Limit database access
- **Audit Logging**: Log all migration activities
- **Backup Security**: Secure backup files
- **Encryption**: Encrypt sensitive data

## Migration Examples

### 1. Adding a New Table

```prisma
// prisma/schema.prisma
model CareLog {
  id        String   @id @default(cuid())
  activity  String
  notes     String?
  staffId   String
  bookingId String
  createdAt DateTime @default(now())
  
  staff   User    @relation(fields: [staffId], references: [id])
  booking Booking @relation(fields: [bookingId], references: [id])
}
```

### 2. Adding a Column with Default Value

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  isActive  Boolean  @default(true)  // New column
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. Adding an Index

```sql
-- prisma/migrations/YYYYMMDD_HHMMSS_add_index/migration.sql
CREATE INDEX "idx_user_email" ON "User" ("email");
CREATE INDEX "idx_booking_created_at" ON "Booking" ("createdAt");
CREATE INDEX "idx_pet_owner_id" ON "Pet" ("ownerId");
```

### 4. Data Migration

```sql
-- prisma/migrations/YYYYMMDD_HHMMSS_update_user_roles/migration.sql
-- Update user roles to use new enum values
UPDATE "User" SET "role" = 'CUSTOMER' WHERE "role" = 'user';
UPDATE "User" SET "role" = 'STAFF' WHERE "role" = 'staff';
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'admin';
UPDATE "User" SET "role" = 'OWNER' WHERE "role" = 'owner';
```

## Emergency Procedures

### 1. Migration Failure

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Check migration status
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Rollback if needed
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate rollback

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

### 2. Data Corruption

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Restore from backup
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U kennel_user kennel_prod < backup_YYYYMMDD_HHMMSS.sql

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

### 3. Performance Issues

```bash
# Check database locks
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_locks;"

# Kill long-running queries
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"

# Restart database if needed
docker-compose -f docker-compose.prod.yml restart db
```

## Contact Information

- **Database Administrator**: dba@kennel.app
- **On-call Engineer**: +1-555-0123
- **Emergency Contact**: +1-555-9999

## Documentation Updates

This migration guide should be updated whenever:
- New migration procedures are added
- Database schema changes significantly
- New tools or processes are introduced
- Emergency procedures are modified

Last updated: $(date)
Version: 1.0.0
