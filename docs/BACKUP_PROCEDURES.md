# Backup Procedures

This document outlines comprehensive backup procedures for the Kennel Management System to ensure data protection and business continuity.

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Database Backups](#database-backups)
4. [Application Backups](#application-backups)
5. [Configuration Backups](#configuration-backups)
6. [Backup Storage](#backup-storage)
7. [Backup Verification](#backup-verification)
8. [Restoration Procedures](#restoration-procedures)
9. [Disaster Recovery](#disaster-recovery)
10. [Monitoring and Alerting](#monitoring-and-alerting)

## Overview

The Kennel Management System requires comprehensive backup procedures to protect critical data including:

- **User Data**: Customer information, pet records, bookings
- **Financial Data**: Payment records, invoices, refunds
- **System Data**: Configuration, logs, audit trails
- **Application Data**: Code, dependencies, assets

### Backup Objectives

- **Recovery Point Objective (RPO)**: 1 hour maximum data loss
- **Recovery Time Objective (RTO)**: 4 hours maximum downtime
- **Retention Period**: 7 years for financial data, 3 years for operational data
- **Compliance**: HIPAA requirements for PHI data

## Backup Strategy

### Backup Types

#### 1. Full Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Storage**: Local + Cloud
- **Compression**: Yes (gzip)

#### 2. Incremental Backups
- **Frequency**: Every 6 hours
- **Retention**: 7 days
- **Storage**: Local + Cloud
- **Compression**: Yes (gzip)

#### 3. Transaction Log Backups
- **Frequency**: Every 15 minutes
- **Retention**: 24 hours
- **Storage**: Local + Cloud
- **Compression**: Yes (gzip)

#### 4. Configuration Backups
- **Frequency**: Daily
- **Retention**: 90 days
- **Storage**: Local + Cloud
- **Compression**: Yes (gzip)

### Backup Schedule

```bash
# Daily full backup
0 2 * * * /opt/backup/scripts/full-backup.sh

# Incremental backups
0 */6 * * * /opt/backup/scripts/incremental-backup.sh

# Transaction log backups
*/15 * * * * /opt/backup/scripts/transaction-log-backup.sh

# Configuration backups
0 3 * * * /opt/backup/scripts/config-backup.sh
```

## Database Backups

### PostgreSQL Backup Procedures

#### 1. Full Database Backup
```bash
#!/bin/bash
# /opt/backup/scripts/full-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/database/full"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_full_${DATE}.sql.gz"
LOG_FILE="/var/log/backup/full-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting full database backup" >> "$LOG_FILE"

# Create full backup
docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    pg_dump -U kennel_user -h localhost -p 5432 kennel_prod \
    --verbose --no-password --format=plain \
    --exclude-table=audit_logs \
    --exclude-table=session_logs \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Full backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/database/full/
    
    # Clean up old local backups (keep 7 days)
    find "$BACKUP_DIR" -name "kennel_full_*.sql.gz" -mtime +7 -delete
    
    echo "$(date): Full backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Full backup failed" >> "$LOG_FILE"
    exit 1
fi
```

#### 2. Incremental Backup
```bash
#!/bin/bash
# /opt/backup/scripts/incremental-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/database/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_incremental_${DATE}.sql.gz"
LOG_FILE="/var/log/backup/incremental-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting incremental database backup" >> "$LOG_FILE"

# Create incremental backup (last 6 hours)
docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    pg_dump -U kennel_user -h localhost -p 5432 kennel_prod \
    --verbose --no-password --format=plain \
    --exclude-table=audit_logs \
    --exclude-table=session_logs \
    --where="updated_at > NOW() - INTERVAL '6 hours'" \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Incremental backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/database/incremental/
    
    # Clean up old local backups (keep 7 days)
    find "$BACKUP_DIR" -name "kennel_incremental_*.sql.gz" -mtime +7 -delete
    
    echo "$(date): Incremental backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Incremental backup failed" >> "$LOG_FILE"
    exit 1
fi
```

#### 3. Transaction Log Backup
```bash
#!/bin/bash
# /opt/backup/scripts/transaction-log-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/database/transaction-logs"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_transaction_${DATE}.sql.gz"
LOG_FILE="/var/log/backup/transaction-log-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting transaction log backup" >> "$LOG_FILE"

# Create transaction log backup
docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    pg_dump -U kennel_user -h localhost -p 5432 kennel_prod \
    --verbose --no-password --format=plain \
    --table=audit_logs \
    --table=session_logs \
    --where="created_at > NOW() - INTERVAL '15 minutes'" \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Transaction log backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/database/transaction-logs/
    
    # Clean up old local backups (keep 1 day)
    find "$BACKUP_DIR" -name "kennel_transaction_*.sql.gz" -mtime +1 -delete
    
    echo "$(date): Transaction log backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Transaction log backup failed" >> "$LOG_FILE"
    exit 1
fi
```

### Database Backup Verification

#### 1. Backup Integrity Check
```bash
#!/bin/bash
# /opt/backup/scripts/verify-backup.sh

set -euo pipefail

BACKUP_FILE="$1"
LOG_FILE="/var/log/backup/verify-backup.log"

echo "$(date): Verifying backup: $BACKUP_FILE" >> "$LOG_FILE"

# Test backup file
if [ ! -f "$BACKUP_FILE" ]; then
    echo "$(date): Backup file not found: $BACKUP_FILE" >> "$LOG_FILE"
    exit 1
fi

# Test backup integrity
if gunzip -t "$BACKUP_FILE"; then
    echo "$(date): Backup integrity check passed: $BACKUP_FILE" >> "$LOG_FILE"
else
    echo "$(date): Backup integrity check failed: $BACKUP_FILE" >> "$LOG_FILE"
    exit 1
fi

# Test backup content
if gunzip -c "$BACKUP_FILE" | head -n 10 | grep -q "PostgreSQL database dump"; then
    echo "$(date): Backup content check passed: $BACKUP_FILE" >> "$LOG_FILE"
else
    echo "$(date): Backup content check failed: $BACKUP_FILE" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Backup verification completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
```

#### 2. Automated Backup Testing
```bash
#!/bin/bash
# /opt/backup/scripts/test-backup.sh

set -euo pipefail

# Configuration
TEST_DB="kennel_test_restore"
BACKUP_FILE="$1"
LOG_FILE="/var/log/backup/test-backup.log"

echo "$(date): Testing backup restoration: $BACKUP_FILE" >> "$LOG_FILE"

# Create test database
docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -c "CREATE DATABASE $TEST_DB;"

# Restore backup to test database
gunzip -c "$BACKUP_FILE" | \
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    psql -U kennel_user -d "$TEST_DB"

# Verify restoration
TABLE_COUNT=$(docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "$(date): Backup restoration test passed: $TABLE_COUNT tables restored" >> "$LOG_FILE"
else
    echo "$(date): Backup restoration test failed: No tables found" >> "$LOG_FILE"
    exit 1
fi

# Clean up test database
docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -c "DROP DATABASE $TEST_DB;"

echo "$(date): Backup restoration test completed successfully" >> "$LOG_FILE"
```

## Application Backups

### Code and Configuration Backup

#### 1. Application Code Backup
```bash
#!/bin/bash
# /opt/backup/scripts/app-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/application"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_app_${DATE}.tar.gz"
LOG_FILE="/var/log/backup/app-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting application backup" >> "$LOG_FILE"

# Create application backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    --exclude=coverage \
    --exclude=dist \
    /opt/kennel/

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Application backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/application/
    
    # Clean up old local backups (keep 30 days)
    find "$BACKUP_DIR" -name "kennel_app_*.tar.gz" -mtime +30 -delete
    
    echo "$(date): Application backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Application backup failed" >> "$LOG_FILE"
    exit 1
fi
```

#### 2. Environment Configuration Backup
```bash
#!/bin/bash
# /opt/backup/scripts/config-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/configuration"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_config_${DATE}.tar.gz"
LOG_FILE="/var/log/backup/config-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting configuration backup" >> "$LOG_FILE"

# Create configuration backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    /opt/kennel/.env \
    /opt/kennel/.env.production \
    /opt/kennel/docker-compose.prod.yml \
    /opt/kennel/nginx.conf \
    /opt/kennel/ssl/ \
    /etc/nginx/ \
    /etc/ssl/ \
    /etc/fail2ban/ \
    /etc/ufw/

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Configuration backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/configuration/
    
    # Clean up old local backups (keep 90 days)
    find "$BACKUP_DIR" -name "kennel_config_*.tar.gz" -mtime +90 -delete
    
    echo "$(date): Configuration backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Configuration backup failed" >> "$LOG_FILE"
    exit 1
fi
```

### Static Assets Backup

#### 1. Static Files Backup
```bash
#!/bin/bash
# /opt/backup/scripts/static-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup/static"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kennel_static_${DATE}.tar.gz"
LOG_FILE="/var/log/backup/static-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting static files backup" >> "$LOG_FILE"

# Create static files backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    /opt/kennel/public/ \
    /opt/kennel/.next/static/ \
    /opt/kennel/.next/standalone/

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "$(date): Static files backup completed successfully: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Upload to cloud storage
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://kennel-backups/static/
    
    # Clean up old local backups (keep 7 days)
    find "$BACKUP_DIR" -name "kennel_static_*.tar.gz" -mtime +7 -delete
    
    echo "$(date): Static files backup uploaded to cloud storage" >> "$LOG_FILE"
else
    echo "$(date): Static files backup failed" >> "$LOG_FILE"
    exit 1
fi
```

## Backup Storage

### Local Storage

#### 1. Local Backup Directory Structure
```
/opt/backup/
├── database/
│   ├── full/
│   ├── incremental/
│   └── transaction-logs/
├── application/
├── configuration/
├── static/
└── logs/
```

#### 2. Local Storage Requirements
- **Minimum Space**: 500GB
- **Recommended Space**: 1TB
- **RAID Configuration**: RAID 1 (mirroring)
- **Backup Rotation**: Automated cleanup

### Cloud Storage

#### 1. AWS S3 Configuration
```bash
# S3 bucket configuration
aws s3 mb s3://kennel-backups
aws s3api put-bucket-versioning --bucket kennel-backups --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket kennel-backups --server-side-encryption-configuration '{
    "Rules": [
        {
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }
    ]
}'
```

#### 2. Cloud Storage Lifecycle
```json
{
    "Rules": [
        {
            "ID": "DatabaseBackups",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "database/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ]
        }
    ]
}
```

## Backup Verification

### Automated Verification

#### 1. Daily Verification Script
```bash
#!/bin/bash
# /opt/backup/scripts/daily-verification.sh

set -euo pipefail

LOG_FILE="/var/log/backup/daily-verification.log"

echo "$(date): Starting daily backup verification" >> "$LOG_FILE"

# Check local backups
LOCAL_BACKUPS=$(find /opt/backup -name "*.gz" -mtime -1 | wc -l)
if [ "$LOCAL_BACKUPS" -gt 0 ]; then
    echo "$(date): Local backups found: $LOCAL_BACKUPS" >> "$LOG_FILE"
else
    echo "$(date): No local backups found in last 24 hours" >> "$LOG_FILE"
    exit 1
fi

# Check cloud backups
CLOUD_BACKUPS=$(aws s3 ls s3://kennel-backups/ --recursive | grep "$(date +%Y-%m-%d)" | wc -l)
if [ "$CLOUD_BACKUPS" -gt 0 ]; then
    echo "$(date): Cloud backups found: $CLOUD_BACKUPS" >> "$LOG_FILE"
else
    echo "$(date): No cloud backups found for today" >> "$LOG_FILE"
    exit 1
fi

# Test backup integrity
LATEST_BACKUP=$(find /opt/backup -name "*.gz" -mtime -1 | head -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    if gunzip -t "$LATEST_BACKUP"; then
        echo "$(date): Latest backup integrity check passed" >> "$LOG_FILE"
    else
        echo "$(date): Latest backup integrity check failed" >> "$LOG_FILE"
        exit 1
    fi
fi

echo "$(date): Daily backup verification completed successfully" >> "$LOG_FILE"
```

#### 2. Weekly Restoration Test
```bash
#!/bin/bash
# /opt/backup/scripts/weekly-restoration-test.sh

set -euo pipefail

LOG_FILE="/var/log/backup/weekly-restoration-test.log"

echo "$(date): Starting weekly restoration test" >> "$LOG_FILE"

# Select a random backup from last week
RANDOM_BACKUP=$(find /opt/backup/database/full -name "*.gz" -mtime -7 | shuf -n 1)

if [ -n "$RANDOM_BACKUP" ]; then
    echo "$(date): Testing restoration of: $RANDOM_BACKUP" >> "$LOG_FILE"
    
    # Run restoration test
    /opt/backup/scripts/test-backup.sh "$RANDOM_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo "$(date): Weekly restoration test passed" >> "$LOG_FILE"
    else
        echo "$(date): Weekly restoration test failed" >> "$LOG_FILE"
        exit 1
    fi
else
    echo "$(date): No backups found for restoration test" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Weekly restoration test completed successfully" >> "$LOG_FILE"
```

## Restoration Procedures

### Database Restoration

#### 1. Full Database Restoration
```bash
#!/bin/bash
# /opt/backup/scripts/restore-database.sh

set -euo pipefail

BACKUP_FILE="$1"
TARGET_DB="${2:-kennel_prod}"

echo "Starting database restoration from: $BACKUP_FILE"
echo "Target database: $TARGET_DB"

# Stop application
docker-compose -f /opt/kennel/docker-compose.prod.yml stop app

# Create backup of current database
CURRENT_BACKUP="/opt/backup/restore/current_$(date +%Y%m%d_%H%M%S).sql.gz"
docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    pg_dump -U kennel_user kennel_prod | gzip > "$CURRENT_BACKUP"

# Drop and recreate database
docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -c "DROP DATABASE IF EXISTS $TARGET_DB;"
docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -c "CREATE DATABASE $TARGET_DB;"

# Restore from backup
gunzip -c "$BACKUP_FILE" | \
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
    psql -U kennel_user -d "$TARGET_DB"

# Verify restoration
TABLE_COUNT=$(docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
    psql -U kennel_user -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "Database restoration completed successfully: $TABLE_COUNT tables restored"
    
    # Start application
    docker-compose -f /opt/kennel/docker-compose.prod.yml start app
    
    echo "Application started successfully"
else
    echo "Database restoration failed: No tables found"
    exit 1
fi
```

#### 2. Point-in-Time Recovery
```bash
#!/bin/bash
# /opt/backup/scripts/point-in-time-recovery.sh

set -euo pipefail

TARGET_TIME="$1"
TARGET_DB="${2:-kennel_prod}"

echo "Starting point-in-time recovery to: $TARGET_TIME"
echo "Target database: $TARGET_DB"

# Stop application
docker-compose -f /opt/kennel/docker-compose.prod.yml stop app

# Find the latest full backup before target time
LATEST_FULL_BACKUP=$(find /opt/backup/database/full -name "*.gz" -newermt "$TARGET_TIME" | sort | head -n 1)

if [ -z "$LATEST_FULL_BACKUP" ]; then
    echo "No full backup found before target time"
    exit 1
fi

echo "Using full backup: $LATEST_FULL_BACKUP"

# Restore full backup
/opt/backup/scripts/restore-database.sh "$LATEST_FULL_BACKUP" "$TARGET_DB"

# Apply incremental backups
find /opt/backup/database/incremental -name "*.gz" -newermt "$(basename "$LATEST_FULL_BACKUP" | cut -d'_' -f2-3)" -not -newermt "$TARGET_TIME" | sort | while read -r incremental_backup; do
    echo "Applying incremental backup: $incremental_backup"
    gunzip -c "$incremental_backup" | \
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
        psql -U kennel_user -d "$TARGET_DB"
done

# Apply transaction log backups
find /opt/backup/database/transaction-logs -name "*.gz" -newermt "$TARGET_TIME" | sort | while read -r transaction_backup; do
    echo "Applying transaction log backup: $transaction_backup"
    gunzip -c "$transaction_backup" | \
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
        psql -U kennel_user -d "$TARGET_DB"
done

echo "Point-in-time recovery completed successfully"
```

### Application Restoration

#### 1. Application Code Restoration
```bash
#!/bin/bash
# /opt/backup/scripts/restore-application.sh

set -euo pipefail

BACKUP_FILE="$1"

echo "Starting application restoration from: $BACKUP_FILE"

# Stop application
docker-compose -f /opt/kennel/docker-compose.prod.yml stop

# Create backup of current application
CURRENT_BACKUP="/opt/backup/restore/app_current_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" /opt/kennel/

# Restore application
cd /opt
tar -xzf "$BACKUP_FILE"

# Restore dependencies
cd /opt/kennel
pnpm install --frozen-lockfile

# Build application
pnpm build

# Start application
docker-compose -f /opt/kennel/docker-compose.prod.yml up -d

echo "Application restoration completed successfully"
```

#### 2. Configuration Restoration
```bash
#!/bin/bash
# /opt/backup/scripts/restore-configuration.sh

set -euo pipefail

BACKUP_FILE="$1"

echo "Starting configuration restoration from: $BACKUP_FILE"

# Stop services
docker-compose -f /opt/kennel/docker-compose.prod.yml stop
sudo systemctl stop nginx
sudo systemctl stop fail2ban

# Create backup of current configuration
CURRENT_BACKUP="/opt/backup/restore/config_current_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" \
    /opt/kennel/.env \
    /opt/kennel/.env.production \
    /opt/kennel/docker-compose.prod.yml \
    /opt/kennel/nginx.conf \
    /etc/nginx/ \
    /etc/ssl/ \
    /etc/fail2ban/ \
    /etc/ufw/

# Restore configuration
cd /
tar -xzf "$BACKUP_FILE"

# Restart services
sudo systemctl start nginx
sudo systemctl start fail2ban
docker-compose -f /opt/kennel/docker-compose.prod.yml up -d

echo "Configuration restoration completed successfully"
```

## Disaster Recovery

### Disaster Recovery Plan

#### 1. Disaster Scenarios
- **Data Center Failure**: Complete infrastructure loss
- **Database Corruption**: Data integrity issues
- **Security Breach**: Unauthorized access
- **Natural Disaster**: Physical infrastructure damage

#### 2. Recovery Procedures

##### Data Center Failure
```bash
# 1. Activate disaster recovery site
# 2. Restore from cloud backups
# 3. Update DNS records
# 4. Verify system functionality
# 5. Notify stakeholders
```

##### Database Corruption
```bash
# 1. Stop application
# 2. Restore from latest backup
# 3. Apply transaction logs
# 4. Verify data integrity
# 5. Restart application
```

##### Security Breach
```bash
# 1. Isolate affected systems
# 2. Change all passwords
# 3. Rotate all keys
# 4. Review access logs
# 5. Implement additional security
```

### Disaster Recovery Testing

#### 1. Monthly DR Test
```bash
#!/bin/bash
# /opt/backup/scripts/monthly-dr-test.sh

set -euo pipefail

LOG_FILE="/var/log/backup/monthly-dr-test.log"

echo "$(date): Starting monthly disaster recovery test" >> "$LOG_FILE"

# Test backup availability
if [ -d "/opt/backup" ]; then
    echo "$(date): Local backups available" >> "$LOG_FILE"
else
    echo "$(date): Local backups not available" >> "$LOG_FILE"
    exit 1
fi

# Test cloud backup access
if aws s3 ls s3://kennel-backups/ > /dev/null 2>&1; then
    echo "$(date): Cloud backups accessible" >> "$LOG_FILE"
else
    echo "$(date): Cloud backups not accessible" >> "$LOG_FILE"
    exit 1
fi

# Test restoration capability
LATEST_BACKUP=$(find /opt/backup/database/full -name "*.gz" | sort | tail -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    /opt/backup/scripts/test-backup.sh "$LATEST_BACKUP"
    if [ $? -eq 0 ]; then
        echo "$(date): Restoration test passed" >> "$LOG_FILE"
    else
        echo "$(date): Restoration test failed" >> "$LOG_FILE"
        exit 1
    fi
else
    echo "$(date): No backups found for testing" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Monthly disaster recovery test completed successfully" >> "$LOG_FILE"
```

## Monitoring and Alerting

### Backup Monitoring

#### 1. Backup Status Monitoring
```bash
#!/bin/bash
# /opt/backup/scripts/monitor-backups.sh

set -euo pipefail

# Check if backups are running
if pgrep -f "backup" > /dev/null; then
    echo "Backup processes are running"
else
    echo "No backup processes found"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text":"⚠️ No backup processes found"}'
fi

# Check backup disk space
DISK_USAGE=$(df /opt/backup | tail -n 1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "Backup disk usage is high: ${DISK_USAGE}%"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"⚠️ Backup disk usage is high: ${DISK_USAGE}%\"}"
fi

# Check cloud backup access
if ! aws s3 ls s3://kennel-backups/ > /dev/null 2>&1; then
    echo "Cloud backup access failed"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text":"⚠️ Cloud backup access failed"}'
fi
```

#### 2. Backup Alerting
```bash
#!/bin/bash
# /opt/backup/scripts/backup-alerts.sh

set -euo pipefail

# Check for failed backups
if grep -q "failed" /var/log/backup/*.log; then
    echo "Failed backups detected"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text":"🚨 Failed backups detected"}'
fi

# Check for missing backups
if [ ! -f "/opt/backup/database/full/kennel_full_$(date +%Y%m%d)*.sql.gz" ]; then
    echo "Daily backup missing"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text":"🚨 Daily backup missing"}'
fi
```

## Conclusion

This backup procedures document provides comprehensive backup and recovery procedures for the Kennel Management System. Regular testing, monitoring, and updates ensure the backup system remains effective and reliable.

The key to successful backup management is:

1. **Automation**: Automated backup processes
2. **Verification**: Regular backup testing
3. **Monitoring**: Continuous backup monitoring
4. **Documentation**: Clear procedures and runbooks
5. **Testing**: Regular disaster recovery testing

Regular review and updates ensure the backup procedures remain effective and aligned with business requirements.
