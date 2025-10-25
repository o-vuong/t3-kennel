#!/bin/bash
# Automated backup testing script for Kennel Management System

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup"
TEST_DB="kennel_test_restore"
LOG_FILE="/var/log/backup/backup-test.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Success message
success() {
    log "SUCCESS: $1"
}

# Warning message
warning() {
    log "WARNING: $1"
}

# Test database backup integrity
test_backup_integrity() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing backup integrity: $test_name"
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    # Test backup file integrity
    if [[ "$backup_file" == *.gz ]]; then
        if ! gunzip -t "$backup_file"; then
            error_exit "Backup file integrity check failed: $backup_file"
        fi
    fi
    
    success "Backup integrity check passed: $test_name"
}

# Test database restoration
test_database_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing database restoration: $test_name"
    
    # Create test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "CREATE DATABASE $TEST_DB;" || true
    
    # Restore backup to test database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | \
            docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB"
    else
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB" < "$backup_file"
    fi
    
    # Verify restoration
    table_count=$(docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [ "$table_count" -gt 0 ]; then
        success "Database restoration test passed: $table_count tables restored"
    else
        error_exit "Database restoration test failed: No tables found"
    fi
    
    # Clean up test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "DROP DATABASE $TEST_DB;"
    
    success "Database restoration test completed: $test_name"
}

# Test application backup restoration
test_application_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing application restoration: $test_name"
    
    # Create test directory
    TEST_DIR="/tmp/kennel_test_$DATE"
    mkdir -p "$TEST_DIR"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$TEST_DIR"
    
    # Verify extracted files
    if [ -f "$TEST_DIR/package.json" ] && [ -f "$TEST_DIR/next.config.js" ]; then
        success "Application restoration test passed: $test_name"
    else
        error_exit "Application restoration test failed: Missing critical files"
    fi
    
    # Clean up test directory
    rm -rf "$TEST_DIR"
    
    success "Application restoration test completed: $test_name"
}

# Test configuration backup restoration
test_configuration_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing configuration restoration: $test_name"
    
    # Create test directory
    TEST_DIR="/tmp/config_test_$DATE"
    mkdir -p "$TEST_DIR"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$TEST_DIR"
    
    # Verify extracted files
    if [ -f "$TEST_DIR/.env" ] && [ -f "$TEST_DIR/docker-compose.prod.yml" ]; then
        success "Configuration restoration test passed: $test_name"
    else
        error_exit "Configuration restoration test failed: Missing critical files"
    fi
    
    # Clean up test directory
    rm -rf "$TEST_DIR"
    
    success "Configuration restoration test completed: $test_name"
}

# Test backup encryption
test_backup_encryption() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing backup encryption: $test_name"
    
    # Check if backup is encrypted
    if [[ "$backup_file" == *.enc ]]; then
        # Test decryption
        if openssl enc -aes-256-cbc -d -in "$backup_file" -out "/tmp/test_decrypt_$DATE" -pass pass:"${BACKUP_ENCRYPTION_KEY:-testkey}" 2>/dev/null; then
            success "Backup encryption test passed: $test_name"
            rm -f "/tmp/test_decrypt_$DATE"
        else
            error_exit "Backup encryption test failed: Cannot decrypt backup"
        fi
    else
        warning "Backup is not encrypted: $test_name"
    fi
}

# Test backup retention
test_backup_retention() {
    local backup_type="$1"
    local retention_days="$2"
    
    log "Testing backup retention: $backup_type (${retention_days} days)"
    
    # Find old backups
    old_backups=$(find "$BACKUP_DIR" -name "*${backup_type}*" -mtime +"$retention_days" 2>/dev/null || true)
    
    if [ -n "$old_backups" ]; then
        warning "Found old backups that should be cleaned up: $old_backups"
    else
        success "Backup retention test passed: No old backups found"
    fi
}

# Test backup monitoring
test_backup_monitoring() {
    log "Testing backup monitoring"
    
    # Check if backup monitoring is working
    if [ -f "/var/log/backup/monitor.log" ]; then
        recent_logs=$(find /var/log/backup -name "*.log" -mtime -1 | wc -l)
        if [ "$recent_logs" -gt 0 ]; then
            success "Backup monitoring test passed: Recent logs found"
        else
            warning "Backup monitoring test: No recent logs found"
        fi
    else
        warning "Backup monitoring test: No monitoring log found"
    fi
}

# Test backup performance
test_backup_performance() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing backup performance: $test_name"
    
    # Measure backup file size
    backup_size=$(du -h "$backup_file" | cut -f1)
    log "Backup size: $backup_size"
    
    # Test backup read performance
    start_time=$(date +%s)
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > /dev/null
    else
        cat "$backup_file" > /dev/null
    fi
    end_time=$(date +%s)
    
    read_time=$((end_time - start_time))
    log "Backup read time: ${read_time}s"
    
    if [ "$read_time" -lt 60 ]; then
        success "Backup performance test passed: Read time ${read_time}s"
    else
        warning "Backup performance test: Slow read time ${read_time}s"
    fi
}

# Main test function
run_backup_tests() {
    log "Starting backup testing: $DATE"
    
    # Test database backups
    if [ -d "$BACKUP_DIR/database/full" ]; then
        latest_db_backup=$(find "$BACKUP_DIR/database/full" -name "*.sql.gz" | sort | tail -n 1)
        if [ -n "$latest_db_backup" ]; then
            test_backup_integrity "$latest_db_backup" "Database Full Backup"
            test_database_restoration "$latest_db_backup" "Database Full Backup"
            test_backup_encryption "$latest_db_backup" "Database Full Backup"
            test_backup_performance "$latest_db_backup" "Database Full Backup"
        else
            warning "No database full backups found"
        fi
    fi
    
    # Test incremental backups
    if [ -d "$BACKUP_DIR/database/incremental" ]; then
        latest_inc_backup=$(find "$BACKUP_DIR/database/incremental" -name "*.sql.gz" | sort | tail -n 1)
        if [ -n "$latest_inc_backup" ]; then
            test_backup_integrity "$latest_inc_backup" "Database Incremental Backup"
            test_backup_encryption "$latest_inc_backup" "Database Incremental Backup"
            test_backup_performance "$latest_inc_backup" "Database Incremental Backup"
        else
            warning "No database incremental backups found"
        fi
    fi
    
    # Test application backups
    if [ -d "$BACKUP_DIR/application" ]; then
        latest_app_backup=$(find "$BACKUP_DIR/application" -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$latest_app_backup" ]; then
            test_backup_integrity "$latest_app_backup" "Application Backup"
            test_application_restoration "$latest_app_backup" "Application Backup"
            test_backup_encryption "$latest_app_backup" "Application Backup"
            test_backup_performance "$latest_app_backup" "Application Backup"
        else
            warning "No application backups found"
        fi
    fi
    
    # Test configuration backups
    if [ -d "$BACKUP_DIR/configuration" ]; then
        latest_config_backup=$(find "$BACKUP_DIR/configuration" -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$latest_config_backup" ]; then
            test_backup_integrity "$latest_config_backup" "Configuration Backup"
            test_configuration_restoration "$latest_config_backup" "Configuration Backup"
            test_backup_encryption "$latest_config_backup" "Configuration Backup"
            test_backup_performance "$latest_config_backup" "Configuration Backup"
        else
            warning "No configuration backups found"
        fi
    fi
    
    # Test backup retention
    test_backup_retention "kennel_full" 7
    test_backup_retention "kennel_incremental" 7
    test_backup_retention "kennel_app" 30
    test_backup_retention "kennel_config" 90
    
    # Test backup monitoring
    test_backup_monitoring
    
    success "All backup tests completed successfully"
}

# Test backup automation
test_backup_automation() {
    log "Testing backup automation"
    
    # Check if backup scripts exist
    backup_scripts=(
        "/opt/backup/scripts/full-backup.sh"
        "/opt/backup/scripts/incremental-backup.sh"
        "/opt/backup/scripts/transaction-log-backup.sh"
        "/opt/backup/scripts/app-backup.sh"
        "/opt/backup/scripts/config-backup.sh"
    )
    
    for script in "${backup_scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                success "Backup script is executable: $script"
            else
                warning "Backup script is not executable: $script"
            fi
        else
            warning "Backup script not found: $script"
        fi
    done
    
    # Check cron jobs
    if crontab -l 2>/dev/null | grep -q "backup"; then
        success "Backup cron jobs found"
    else
        warning "No backup cron jobs found"
    fi
}

# Test backup cloud storage
test_backup_cloud_storage() {
    log "Testing backup cloud storage"
    
    # Check if AWS CLI is configured
    if command -v aws >/dev/null 2>&1; then
        if aws s3 ls s3://kennel-backups/ >/dev/null 2>&1; then
            success "Cloud storage access test passed"
        else
            warning "Cloud storage access test failed"
        fi
    else
        warning "AWS CLI not found"
    fi
}

# Generate test report
generate_test_report() {
    local report_file="/opt/backup/reports/backup-test-${DATE}.md"
    
    log "Generating backup test report: $report_file"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# Backup Test Report - $DATE

## Test Summary
- **Test Date**: $(date)
- **Test Duration**: [Duration]
- **Overall Status**: [PASS/FAIL]

## Test Results

### Database Backups
- **Full Backup**: [Status]
- **Incremental Backup**: [Status]
- **Transaction Log Backup**: [Status]

### Application Backups
- **Code Backup**: [Status]
- **Configuration Backup**: [Status]
- **Static Assets Backup**: [Status]

### Backup Integrity
- **File Integrity**: [Status]
- **Encryption**: [Status]
- **Performance**: [Status]

### Restoration Tests
- **Database Restoration**: [Status]
- **Application Restoration**: [Status]
- **Configuration Restoration**: [Status]

### Backup Management
- **Retention Policy**: [Status]
- **Monitoring**: [Status]
- **Automation**: [Status]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Follow-up Actions
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
EOF
    
    success "Backup test report generated: $report_file"
}

# Main execution
main() {
    log "Starting comprehensive backup testing"
    
    # Run all tests
    run_backup_tests
    test_backup_automation
    test_backup_cloud_storage
    generate_test_report
    
    log "Backup testing completed successfully"
}

# Run main function
main "$@"
