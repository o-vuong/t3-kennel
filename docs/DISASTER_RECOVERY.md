# Disaster Recovery Plan

This document outlines comprehensive disaster recovery procedures for the Kennel Management System to ensure business continuity in the event of various disaster scenarios.

## Table of Contents

1. [Overview](#overview)
2. [Disaster Scenarios](#disaster-scenarios)
3. [Recovery Objectives](#recovery-objectives)
4. [Recovery Procedures](#recovery-procedures)
5. [Communication Plan](#communication-plan)
6. [Testing Procedures](#testing-procedures)
7. [Maintenance and Updates](#maintenance-and-updates)

## Overview

The Kennel Management System disaster recovery plan ensures business continuity through:

- **Rapid Recovery**: Quick restoration of critical services
- **Data Protection**: Comprehensive backup and recovery procedures
- **Communication**: Clear stakeholder communication
- **Testing**: Regular disaster recovery testing
- **Documentation**: Detailed procedures and runbooks

### Key Principles

- **Business Continuity**: Minimize service disruption
- **Data Integrity**: Protect critical data
- **Security**: Maintain security during recovery
- **Communication**: Keep stakeholders informed
- **Learning**: Improve procedures based on experience

## Disaster Scenarios

### Category 1: Infrastructure Failures

#### 1.1 Data Center Outage
- **Description**: Complete loss of primary data center
- **Impact**: Total service unavailability
- **Recovery Time**: 4-8 hours
- **Recovery Point**: 1 hour maximum data loss

#### 1.2 Server Hardware Failure
- **Description**: Critical server hardware failure
- **Impact**: Service degradation or outage
- **Recovery Time**: 2-4 hours
- **Recovery Point**: 15 minutes maximum data loss

#### 1.3 Network Connectivity Loss
- **Description**: Network infrastructure failure
- **Impact**: Service unavailability
- **Recovery Time**: 1-2 hours
- **Recovery Point**: No data loss

### Category 2: Data Loss Scenarios

#### 2.1 Database Corruption
- **Description**: Database integrity issues
- **Impact**: Data loss or corruption
- **Recovery Time**: 2-6 hours
- **Recovery Point**: 1 hour maximum data loss

#### 2.2 Storage System Failure
- **Description**: Storage infrastructure failure
- **Impact**: Data loss or corruption
- **Recovery Time**: 4-8 hours
- **Recovery Point**: 1 hour maximum data loss

#### 2.3 Backup System Failure
- **Description**: Backup infrastructure failure
- **Impact**: Loss of recovery capability
- **Recovery Time**: 8-24 hours
- **Recovery Point**: 1 hour maximum data loss

### Category 3: Security Incidents

#### 3.1 Security Breach
- **Description**: Unauthorized system access
- **Impact**: Data exposure, service compromise
- **Recovery Time**: 4-12 hours
- **Recovery Point**: Immediate response required

#### 3.2 Ransomware Attack
- **Description**: System encryption by malicious software
- **Impact**: Complete system unavailability
- **Recovery Time**: 8-24 hours
- **Recovery Point**: 1 hour maximum data loss

#### 3.3 DDoS Attack
- **Description**: Distributed denial of service attack
- **Impact**: Service unavailability
- **Recovery Time**: 1-4 hours
- **Recovery Point**: No data loss

### Category 4: Natural Disasters

#### 4.1 Natural Disaster
- **Description**: Earthquake, flood, fire, etc.
- **Impact**: Complete infrastructure loss
- **Recovery Time**: 24-72 hours
- **Recovery Point**: 1 hour maximum data loss

#### 4.2 Power Outage
- **Description**: Extended power failure
- **Impact**: Service unavailability
- **Recovery Time**: 2-8 hours
- **Recovery Point**: No data loss

## Recovery Objectives

### Recovery Time Objectives (RTO)

| Service | RTO | Priority |
|---------|-----|----------|
| Database | 2 hours | Critical |
| Application | 4 hours | Critical |
| Authentication | 1 hour | Critical |
| Payment Processing | 2 hours | High |
| User Interface | 4 hours | High |
| Reporting | 8 hours | Medium |
| Analytics | 24 hours | Low |

### Recovery Point Objectives (RPO)

| Data Type | RPO | Priority |
|-----------|-----|----------|
| User Data | 15 minutes | Critical |
| Financial Data | 15 minutes | Critical |
| Booking Data | 15 minutes | Critical |
| Audit Logs | 1 hour | High |
| System Logs | 4 hours | Medium |
| Analytics Data | 24 hours | Low |

### Service Level Agreements (SLA)

| Service | Availability | Downtime |
|---------|-------------|----------|
| Critical Services | 99.9% | 8.76 hours/year |
| High Priority | 99.5% | 43.8 hours/year |
| Medium Priority | 99.0% | 87.6 hours/year |
| Low Priority | 95.0% | 438 hours/year |

## Recovery Procedures

### Phase 1: Immediate Response (0-30 minutes)

#### 1.1 Incident Detection
```bash
# Check system health
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/api/health/live

# Check service status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check system resources
htop
df -h
free -h
```

#### 1.2 Initial Assessment
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT 1"

# Check Redis status
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check application status
docker-compose -f docker-compose.prod.yml exec app pnpm health:check
```

#### 1.3 Communication
- **Internal**: Notify response team
- **External**: Update status page
- **Users**: Communicate if significant impact

### Phase 2: Investigation (30-60 minutes)

#### 2.1 Technical Investigation
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app --tail=500

# Check database logs
docker-compose -f docker-compose.prod.yml logs db --tail=500

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis --tail=500

# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx --tail=500

# Check system logs
journalctl -u docker --since "1 hour ago"
journalctl -u nginx --since "1 hour ago"
```

#### 2.2 Database Investigation
```bash
# Check database connections
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_activity;"

# Check database locks
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_locks;"

# Check database size
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT pg_size_pretty(pg_database_size('kennel_prod'));"

# Check recent queries
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### 2.3 Security Investigation
```bash
# Check authentication logs
grep "authentication" /var/log/auth.log

# Check failed login attempts
grep "Failed password" /var/log/auth.log

# Check suspicious activity
grep "suspicious" /var/log/nginx/access.log

# Check rate limiting
grep "rate limit" /var/log/nginx/error.log
```

### Phase 3: Recovery (1-4 hours)

#### 3.1 Service Recovery
```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart app

# Check service health
docker-compose -f docker-compose.prod.yml ps
curl https://your-domain.com/api/health
```

#### 3.2 Database Recovery
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Restart database if needed
docker-compose -f docker-compose.prod.yml restart db

# Verify database connectivity
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT 1"
```

#### 3.3 Security Recovery
```bash
# Check security status
grep "security" /var/log/nginx/access.log

# Restart security services
sudo systemctl restart fail2ban
sudo systemctl restart ufw

# Check firewall status
sudo ufw status
```

### Phase 4: Verification (1-2 hours)

#### 4.1 Service Verification
```bash
# Check all health endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/api/health/live

# Test critical functionality
# - User login
# - Pet registration
# - Booking creation
# - Payment processing
```

#### 4.2 Performance Verification
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_database;"

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec redis redis-cli info stats
```

#### 4.3 Security Verification
```bash
# Check security headers
curl -I https://your-domain.com

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check rate limiting
curl -I https://your-domain.com/api/health
```

## Communication Plan

### Internal Communication

#### P1 Incidents
- **Immediate**: Call on-call engineer
- **5 minutes**: Notify technical lead
- **15 minutes**: Notify management
- **30 minutes**: Notify all stakeholders

#### P2 Incidents
- **Immediate**: Notify on-call engineer
- **30 minutes**: Notify technical lead
- **1 hour**: Notify management

#### P3/P4 Incidents
- **Immediate**: Create incident ticket
- **4 hours**: Notify technical lead
- **24 hours**: Notify management

### External Communication

#### Status Page Updates
- **P1**: Immediate update, every 15 minutes
- **P2**: Update within 1 hour, every hour
- **P3**: Update within 4 hours, every 4 hours
- **P4**: Update within 24 hours

#### User Communication
- **P1**: Immediate notification to affected users
- **P2**: Notification within 1 hour
- **P3**: Notification within 4 hours
- **P4**: Notification within 24 hours

### Communication Templates

#### P1 Incident Notification
```
Subject: [P1] Critical System Incident - [Service Name]

We are currently experiencing a critical system incident affecting [Service Name].

Impact: [Description of impact]
Status: [Current status]
ETA: [Estimated resolution time]

We are working to resolve this issue as quickly as possible.

Updates will be provided every 15 minutes.

Thank you for your patience.
```

#### P2 Incident Notification
```
Subject: [P2] System Incident - [Service Name]

We are currently experiencing a system incident affecting [Service Name].

Impact: [Description of impact]
Status: [Current status]
ETA: [Estimated resolution time]

We are working to resolve this issue.

Updates will be provided every hour.

Thank you for your patience.
```

## Testing Procedures

### Monthly DR Test

#### 1. Test Planning
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

#### 2. Test Execution
```bash
#!/bin/bash
# /opt/backup/scripts/execute-dr-test.sh

set -euo pipefail

TEST_TYPE="$1"
LOG_FILE="/var/log/backup/dr-test-${TEST_TYPE}.log"

echo "$(date): Starting ${TEST_TYPE} disaster recovery test" >> "$LOG_FILE"

case "$TEST_TYPE" in
    "backup-restoration")
        # Test backup restoration
        LATEST_BACKUP=$(find /opt/backup/database/full -name "*.gz" | sort | tail -n 1)
        if [ -n "$LATEST_BACKUP" ]; then
            /opt/backup/scripts/test-backup.sh "$LATEST_BACKUP"
            if [ $? -eq 0 ]; then
                echo "$(date): Backup restoration test passed" >> "$LOG_FILE"
            else
                echo "$(date): Backup restoration test failed" >> "$LOG_FILE"
                exit 1
            fi
        fi
        ;;
    "application-restoration")
        # Test application restoration
        LATEST_APP_BACKUP=$(find /opt/backup/application -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$LATEST_APP_BACKUP" ]; then
            /opt/backup/scripts/test-app-backup.sh "$LATEST_APP_BACKUP"
            if [ $? -eq 0 ]; then
                echo "$(date): Application restoration test passed" >> "$LOG_FILE"
            else
                echo "$(date): Application restoration test failed" >> "$LOG_FILE"
                exit 1
            fi
        fi
        ;;
    "configuration-restoration")
        # Test configuration restoration
        LATEST_CONFIG_BACKUP=$(find /opt/backup/configuration -name "*.tar.gz" | sort | tail -n 1)
        if [ -n "$LATEST_CONFIG_BACKUP" ]; then
            /opt/backup/scripts/test-config-backup.sh "$LATEST_CONFIG_BACKUP"
            if [ $? -eq 0 ]; then
                echo "$(date): Configuration restoration test passed" >> "$LOG_FILE"
            else
                echo "$(date): Configuration restoration test failed" >> "$LOG_FILE"
                exit 1
            fi
        fi
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        exit 1
        ;;
esac

echo "$(date): ${TEST_TYPE} disaster recovery test completed successfully" >> "$LOG_FILE"
```

### Quarterly DR Test

#### 1. Full System Recovery Test
```bash
#!/bin/bash
# /opt/backup/scripts/quarterly-dr-test.sh

set -euo pipefail

LOG_FILE="/var/log/backup/quarterly-dr-test.log"

echo "$(date): Starting quarterly disaster recovery test" >> "$LOG_FILE"

# Test 1: Database recovery
echo "$(date): Testing database recovery" >> "$LOG_FILE"
/opt/backup/scripts/execute-dr-test.sh "backup-restoration"
if [ $? -eq 0 ]; then
    echo "$(date): Database recovery test passed" >> "$LOG_FILE"
else
    echo "$(date): Database recovery test failed" >> "$LOG_FILE"
    exit 1
fi

# Test 2: Application recovery
echo "$(date): Testing application recovery" >> "$LOG_FILE"
/opt/backup/scripts/execute-dr-test.sh "application-restoration"
if [ $? -eq 0 ]; then
    echo "$(date): Application recovery test passed" >> "$LOG_FILE"
else
    echo "$(date): Application recovery test failed" >> "$LOG_FILE"
    exit 1
fi

# Test 3: Configuration recovery
echo "$(date): Testing configuration recovery" >> "$LOG_FILE"
/opt/backup/scripts/execute-dr-test.sh "configuration-restoration"
if [ $? -eq 0 ]; then
    echo "$(date): Configuration recovery test passed" >> "$LOG_FILE"
else
    echo "$(date): Configuration recovery test failed" >> "$LOG_FILE"
    exit 1
fi

# Test 4: End-to-end functionality
echo "$(date): Testing end-to-end functionality" >> "$LOG_FILE"
curl -f https://your-domain.com/api/health
if [ $? -eq 0 ]; then
    echo "$(date): End-to-end functionality test passed" >> "$LOG_FILE"
else
    echo "$(date): End-to-end functionality test failed" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Quarterly disaster recovery test completed successfully" >> "$LOG_FILE"
```

#### 2. Test Results Documentation
```bash
#!/bin/bash
# /opt/backup/scripts/document-dr-test.sh

set -euo pipefail

TEST_DATE=$(date +%Y%m%d)
LOG_FILE="/var/log/backup/dr-test-${TEST_DATE}.log"

echo "$(date): Documenting disaster recovery test results" >> "$LOG_FILE"

# Create test report
cat > "/opt/backup/reports/dr-test-${TEST_DATE}.md" << EOF
# Disaster Recovery Test Report - ${TEST_DATE}

## Test Overview
- **Date**: $(date)
- **Type**: Quarterly DR Test
- **Duration**: [Duration]
- **Status**: [Pass/Fail]

## Test Results

### Database Recovery
- **Status**: [Pass/Fail]
- **Duration**: [Duration]
- **Issues**: [Issues found]

### Application Recovery
- **Status**: [Pass/Fail]
- **Duration**: [Duration]
- **Issues**: [Issues found]

### Configuration Recovery
- **Status**: [Pass/Fail]
- **Duration**: [Duration]
- **Issues**: [Issues found]

### End-to-End Functionality
- **Status**: [Pass/Fail]
- **Duration**: [Duration]
- **Issues**: [Issues found]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Follow-up Actions
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
EOF

echo "$(date): Disaster recovery test report created" >> "$LOG_FILE"
```

## Maintenance and Updates

### Regular Maintenance

#### 1. Daily
- **Backup Verification**: Check backup status
- **Log Review**: Review error logs
- **Performance Review**: Review performance metrics
- **Security Review**: Review security logs

#### 2. Weekly
- **System Updates**: Check for system updates
- **Security Updates**: Check for security updates
- **Backup Verification**: Verify backups
- **Performance Analysis**: Analyze performance trends

#### 3. Monthly
- **Security Audit**: Comprehensive security review
- **Performance Optimization**: Performance improvements
- **Capacity Planning**: Review capacity needs
- **Disaster Recovery**: Test disaster recovery procedures

### Documentation Updates

#### 1. Procedure Updates
- **Quarterly**: Review and update procedures
- **After Incidents**: Update based on lessons learned
- **After Tests**: Update based on test results
- **Annual**: Comprehensive procedure review

#### 2. Contact Information
- **Monthly**: Verify contact information
- **Quarterly**: Update contact information
- **Annually**: Comprehensive contact review

#### 3. Training
- **Quarterly**: Team training sessions
- **Annually**: Comprehensive training review
- **After Incidents**: Additional training as needed

## Conclusion

This disaster recovery plan provides comprehensive procedures for responding to various disaster scenarios affecting the Kennel Management System. Regular testing, maintenance, and updates ensure the plan remains effective and relevant.

The key to successful disaster recovery is:

1. **Preparation**: Comprehensive planning and procedures
2. **Testing**: Regular testing and validation
3. **Communication**: Clear communication during incidents
4. **Documentation**: Detailed procedures and runbooks
5. **Learning**: Continuous improvement based on experience

Regular review and updates ensure the disaster recovery plan remains effective and aligned with business requirements.
