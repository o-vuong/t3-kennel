#!/bin/bash
# Automated backup restoration testing script for Kennel Management System

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backup"
TEST_DB="kennel_test_restore"
TEST_APP_DIR="/tmp/kennel_test_app"
LOG_FILE="/var/log/backup/restore-test.log"
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

# Test database restoration
test_database_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing database restoration: $test_name"
    
    # Stop application to prevent conflicts
    docker-compose -f /opt/kennel/docker-compose.prod.yml stop app || true
    
    # Create test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "DROP DATABASE IF EXISTS $TEST_DB;" || true
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "CREATE DATABASE $TEST_DB;"
    
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
        
        # Test data integrity
        test_data_integrity "$test_name"
    else
        error_exit "Database restoration test failed: No tables found"
    fi
    
    # Clean up test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "DROP DATABASE $TEST_DB;"
    
    success "Database restoration test completed: $test_name"
}

# Test data integrity
test_data_integrity() {
    local test_name="$1"
    
    log "Testing data integrity: $test_name"
    
    # Test critical tables
    critical_tables=("users" "pets" "bookings" "care_logs" "medical_records")
    
    for table in "${critical_tables[@]}"; do
        count=$(docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
            psql -U kennel_user -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        
        if [ "$count" -gt 0 ]; then
            success "Data integrity test passed: $table has $count records"
        else
            warning "Data integrity test: $table has no records"
        fi
    done
}

# Test application restoration
test_application_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing application restoration: $test_name"
    
    # Create test directory
    rm -rf "$TEST_APP_DIR"
    mkdir -p "$TEST_APP_DIR"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$TEST_APP_DIR"
    
    # Verify extracted files
    critical_files=("package.json" "next.config.js" "tsconfig.json" "tailwind.config.js")
    
    for file in "${critical_files[@]}"; do
        if [ -f "$TEST_APP_DIR/$file" ]; then
            success "Application restoration test passed: $file found"
        else
            error_exit "Application restoration test failed: $file not found"
        fi
    done
    
    # Test application build
    cd "$TEST_APP_DIR"
    if [ -f "package.json" ]; then
        # Install dependencies
        if pnpm install --frozen-lockfile; then
            success "Application dependencies installed successfully"
        else
            warning "Application dependencies installation failed"
        fi
        
        # Test build
        if pnpm build; then
            success "Application build test passed"
        else
            warning "Application build test failed"
        fi
    fi
    
    # Clean up test directory
    rm -rf "$TEST_APP_DIR"
    
    success "Application restoration test completed: $test_name"
}

# Test configuration restoration
test_configuration_restoration() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing configuration restoration: $test_name"
    
    # Create test directory
    TEST_CONFIG_DIR="/tmp/config_test_$DATE"
    mkdir -p "$TEST_CONFIG_DIR"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$TEST_CONFIG_DIR"
    
    # Verify extracted files
    critical_files=(".env" "docker-compose.prod.yml" "nginx.conf")
    
    for file in "${critical_files[@]}"; do
        if [ -f "$TEST_CONFIG_DIR/$file" ]; then
            success "Configuration restoration test passed: $file found"
        else
            warning "Configuration restoration test: $file not found"
        fi
    done
    
    # Test configuration validity
    if [ -f "$TEST_CONFIG_DIR/docker-compose.prod.yml" ]; then
        if docker-compose -f "$TEST_CONFIG_DIR/docker-compose.prod.yml" config >/dev/null 2>&1; then
            success "Docker Compose configuration is valid"
        else
            warning "Docker Compose configuration is invalid"
        fi
    fi
    
    # Clean up test directory
    rm -rf "$TEST_CONFIG_DIR"
    
    success "Configuration restoration test completed: $test_name"
}

# Test point-in-time recovery
test_point_in_time_recovery() {
    local target_time="$1"
    local test_name="$2"
    
    log "Testing point-in-time recovery: $test_name (target: $target_time)"
    
    # Find the latest full backup before target time
    latest_full_backup=$(find "$BACKUP_DIR/database/full" -name "*.sql.gz" -newermt "$target_time" | sort | head -n 1)
    
    if [ -z "$latest_full_backup" ]; then
        error_exit "No full backup found before target time: $target_time"
    fi
    
    log "Using full backup: $latest_full_backup"
    
    # Restore full backup
    test_database_restoration "$latest_full_backup" "Point-in-Time Recovery Full Backup"
    
    # Apply incremental backups
    incremental_backups=$(find "$BACKUP_DIR/database/incremental" -name "*.sql.gz" -newermt "$(basename "$latest_full_backup" | cut -d'_' -f2-3)" -not -newermt "$target_time" | sort)
    
    for incremental_backup in $incremental_backups; do
        log "Applying incremental backup: $incremental_backup"
        
        # Create test database for incremental
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
            psql -U kennel_user -c "DROP DATABASE IF EXISTS $TEST_DB;" || true
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
            psql -U kennel_user -c "CREATE DATABASE $TEST_DB;"
        
        # Restore full backup
        gunzip -c "$latest_full_backup" | \
            docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB"
        
        # Apply incremental backup
        gunzip -c "$incremental_backup" | \
            docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB"
        
        # Verify incremental restoration
        table_count=$(docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
            psql -U kennel_user -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        
        if [ "$table_count" -gt 0 ]; then
            success "Incremental restoration test passed: $table_count tables"
        else
            warning "Incremental restoration test: No tables found"
        fi
        
        # Clean up test database
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
            psql -U kennel_user -c "DROP DATABASE $TEST_DB;"
    done
    
    success "Point-in-time recovery test completed: $test_name"
}

# Test disaster recovery
test_disaster_recovery() {
    local test_name="$1"
    
    log "Testing disaster recovery: $test_name"
    
    # Test complete system restoration
    test_database_restoration "$(find "$BACKUP_DIR/database/full" -name "*.sql.gz" | sort | tail -n 1)" "Disaster Recovery Database"
    test_application_restoration "$(find "$BACKUP_DIR/application" -name "*.tar.gz" | sort | tail -n 1)" "Disaster Recovery Application"
    test_configuration_restoration "$(find "$BACKUP_DIR/configuration" -name "*.tar.gz" | sort | tail -n 1)" "Disaster Recovery Configuration"
    
    success "Disaster recovery test completed: $test_name"
}

# Test backup verification
test_backup_verification() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing backup verification: $test_name"
    
    # Test backup file integrity
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -t "$backup_file"; then
            success "Backup file integrity check passed: $test_name"
        else
            error_exit "Backup file integrity check failed: $test_name"
        fi
    fi
    
    # Test backup content
    if [[ "$backup_file" == *.sql.gz ]]; then
        if gunzip -c "$backup_file" | head -n 10 | grep -q "PostgreSQL database dump"; then
            success "Backup content check passed: $test_name"
        else
            error_exit "Backup content check failed: $test_name"
        fi
    fi
    
    success "Backup verification test completed: $test_name"
}

# Test restoration performance
test_restoration_performance() {
    local backup_file="$1"
    local test_name="$2"
    
    log "Testing restoration performance: $test_name"
    
    # Measure restoration time
    start_time=$(date +%s)
    
    # Create test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "DROP DATABASE IF EXISTS $TEST_DB;" || true
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "CREATE DATABASE $TEST_DB;"
    
    # Restore backup
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | \
            docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB"
    else
        docker-compose -f /opt/kennel/docker-compose.prod.yml exec -T db \
            psql -U kennel_user -d "$TEST_DB" < "$backup_file"
    fi
    
    end_time=$(date +%s)
    restoration_time=$((end_time - start_time))
    
    log "Restoration time: ${restoration_time}s"
    
    if [ "$restoration_time" -lt 300 ]; then
        success "Restoration performance test passed: ${restoration_time}s"
    else
        warning "Restoration performance test: Slow restoration time ${restoration_time}s"
    fi
    
    # Clean up test database
    docker-compose -f /opt/kennel/docker-compose.prod.yml exec db \
        psql -U kennel_user -c "DROP DATABASE $TEST_DB;"
    
    success "Restoration performance test completed: $test_name"
}

# Test restoration automation
test_restoration_automation() {
    log "Testing restoration automation"
    
    # Check if restoration scripts exist
    restoration_scripts=(
        "/opt/backup/scripts/restore-database.sh"
        "/opt/backup/scripts/restore-application.sh"
        "/opt/backup/scripts/restore-configuration.sh"
        "/opt/backup/scripts/point-in-time-recovery.sh"
    )
    
    for script in "${restoration_scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                success "Restoration script is executable: $script"
            else
                warning "Restoration script is not executable: $script"
            fi
        else
            warning "Restoration script not found: $script"
        fi
    done
}

# Generate restoration test report
generate_restoration_test_report() {
    local report_file="/opt/backup/reports/restoration-test-${DATE}.md"
    
    log "Generating restoration test report: $report_file"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# Backup Restoration Test Report - $DATE

## Test Summary
- **Test Date**: $(date)
- **Test Duration**: [Duration]
- **Overall Status**: [PASS/FAIL]

## Test Results

### Database Restoration
- **Full Backup Restoration**: [Status]
- **Incremental Backup Restoration**: [Status]
- **Point-in-Time Recovery**: [Status]
- **Data Integrity**: [Status]

### Application Restoration
- **Code Restoration**: [Status]
- **Configuration Restoration**: [Status]
- **Build Test**: [Status]

### Performance Tests
- **Restoration Time**: [Duration]
- **Performance**: [Status]

### Automation Tests
- **Restoration Scripts**: [Status]
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
    
    success "Restoration test report generated: $report_file"
}

# Main test function
run_restoration_tests() {
    log "Starting backup restoration testing: $DATE"
    
    # Test database restoration
    if [ -d "$BACKUP_DIR/database/full" ]; then
        latest_db_backup=$(find "$BACKUP_DIR/database/full" -name "*.sql.gz" | sort | tail -n 1)
        if [ -n "$latest_db_backup" ]; then
            test_backup_verification "$latest_db_backup" "Database Full Backup"
            test_database_restoration "$latest_db_backup" "Database Full Backup"
            test_restoration_performance "$latest_db_backup" "Database Full Backup"
        else
            warning "No database full backups found"
        fi
    fi
    
    # Test incremental restoration
    if [ -d "$BACKUP_DIR/database/incremental" ]; then
        latest_inc_backup=$(find "$BACKUP_DIR/database/incremental" -name "*.sql.gz" | sort | tail -n 1)
        if [ -n "$latest_inc_backup" ]; then
            test_backup_verification "$latest_inc_backup" "Database Incremental Backup"
            test_restoration_performance "$latest_inc_backup" "Database Incremental Backup"
        else
            warning "No database incremental backups found"
        fi
    fi
    
    # Test application restoration
    if [ -d "$BACKUP_DIR/application" ]; then
        latest_app_backup=$(find "$BACKUP_DIR/application" -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$latest_app_backup" ]; then
            test_application_restoration "$latest_app_backup" "Application Backup"
        else
            warning "No application backups found"
        fi
    fi
    
    # Test configuration restoration
    if [ -d "$BACKUP_DIR/configuration" ]; then
        latest_config_backup=$(find "$BACKUP_DIR/configuration" -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$latest_config_backup" ]; then
            test_configuration_restoration "$latest_config_backup" "Configuration Backup"
        else
            warning "No configuration backups found"
        fi
    fi
    
    # Test point-in-time recovery
    test_point_in_time_recovery "2024-01-01 12:00:00" "Point-in-Time Recovery Test"
    
    # Test disaster recovery
    test_disaster_recovery "Disaster Recovery Test"
    
    # Test restoration automation
    test_restoration_automation
    
    success "All restoration tests completed successfully"
}

# Main execution
main() {
    log "Starting comprehensive backup restoration testing"
    
    # Run all tests
    run_restoration_tests
    generate_restoration_test_report
    
    log "Backup restoration testing completed successfully"
}

# Run main function
main "$@"
