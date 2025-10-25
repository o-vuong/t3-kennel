# Incident Response Playbook

This document provides comprehensive procedures for responding to incidents in the Kennel Management System.

## Table of Contents

1. [Overview](#overview)
2. [Incident Classification](#incident-classification)
3. [Response Team](#response-team)
4. [Response Procedures](#response-procedures)
5. [Communication Plan](#communication-plan)
6. [Recovery Procedures](#recovery-procedures)
7. [Post-Incident Review](#post-incident-review)
8. [Prevention Measures](#prevention-measures)

## Overview

This incident response playbook is designed to ensure rapid, effective response to any incidents affecting the Kennel Management System. The goal is to minimize impact on users and restore service as quickly as possible.

### Key Principles

- **User Safety First**: Protect user data and privacy
- **Rapid Response**: Quick identification and resolution
- **Clear Communication**: Keep stakeholders informed
- **Documentation**: Record all actions and decisions
- **Learning**: Improve processes based on incidents

## Incident Classification

### Severity Levels

#### P1 - Critical (Emergency)
- **Definition**: Complete system outage or data breach
- **Impact**: Service unavailable, data at risk
- **Response Time**: 15 minutes
- **Examples**:
  - Database corruption
  - Security breach
  - Complete system failure
  - Data loss

#### P2 - High (Urgent)
- **Definition**: Major functionality unavailable
- **Impact**: Significant user impact
- **Response Time**: 1 hour
- **Examples**:
  - Payment processing down
  - Authentication failure
  - Booking system unavailable
  - Performance degradation

#### P3 - Medium (Important)
- **Definition**: Minor functionality issues
- **Impact**: Limited user impact
- **Response Time**: 4 hours
- **Examples**:
  - UI issues
  - Minor performance issues
  - Non-critical feature failures
  - Notification delays

#### P4 - Low (Normal)
- **Definition**: Cosmetic issues or minor bugs
- **Impact**: Minimal user impact
- **Response Time**: 24 hours
- **Examples**:
  - UI inconsistencies
  - Minor bugs
  - Documentation issues
  - Enhancement requests

## Response Team

### Primary Team

- **Incident Commander**: Overall incident coordination
- **Technical Lead**: Technical investigation and resolution
- **Security Lead**: Security-related incidents
- **Communications Lead**: Stakeholder communication
- **Database Administrator**: Database-related issues
- **System Administrator**: Infrastructure issues

### Escalation Chain

1. **Level 1**: On-call engineer
2. **Level 2**: Technical lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO/VP Engineering
5. **Level 5**: CEO (for P1 incidents)

### Contact Information

- **On-call Engineer**: +1-555-0123
- **Technical Lead**: +1-555-0124
- **Security Lead**: +1-555-0125
- **Database Admin**: +1-555-0126
- **System Admin**: +1-555-0127
- **Emergency Contact**: +1-555-9999

## Response Procedures

### Initial Response (0-15 minutes)

#### 1. Incident Detection
- **Automated Alerts**: Monitor alerts from Sentry, health checks, metrics
- **User Reports**: Customer support tickets, user feedback
- **Manual Detection**: Team member identification

#### 2. Initial Assessment
```bash
# Check system health
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/api/health/live

# Check service status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT 1"
```

#### 3. Severity Classification
- Assess impact on users
- Determine severity level
- Activate appropriate response team

#### 4. Initial Communication
- **Internal**: Notify response team
- **External**: Update status page if needed
- **Users**: Communicate if significant impact

### Investigation Phase (15-60 minutes)

#### 1. Technical Investigation
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app --tail=500

# Check database logs
docker-compose -f docker-compose.prod.yml logs db --tail=500

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis --tail=500

# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx --tail=500

# Check system resources
htop
df -h
free -h
```

#### 2. Database Investigation
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

#### 3. Security Investigation
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

#### 4. Performance Investigation
```bash
# Check application metrics
curl https://your-domain.com/api/metrics

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_database;"

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec redis redis-cli info stats

# Check system performance
iostat -x 1 5
```

### Resolution Phase (1-4 hours)

#### 1. Immediate Actions
- **Service Restart**: If safe to do so
- **Database Recovery**: If database issues
- **Security Measures**: If security incident
- **Performance Optimization**: If performance issues

#### 2. Service Recovery
```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart app

# Check service health
docker-compose -f docker-compose.prod.yml ps
curl https://your-domain.com/api/health
```

#### 3. Database Recovery
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Restart database if needed
docker-compose -f docker-compose.prod.yml restart db

# Verify database connectivity
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT 1"
```

#### 4. Security Recovery
```bash
# Check security status
grep "security" /var/log/nginx/access.log

# Restart security services
sudo systemctl restart fail2ban
sudo systemctl restart ufw

# Check firewall status
sudo ufw status
```

### Verification Phase (1-2 hours)

#### 1. Service Verification
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

#### 2. Performance Verification
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_database;"

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec redis redis-cli info stats
```

#### 3. Security Verification
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

## Recovery Procedures

### Database Recovery

#### 1. Database Corruption
```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Check database integrity
docker-compose -f docker-compose.prod.yml exec db pg_dump -U kennel_user kennel_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U kennel_user kennel_prod < backup_YYYYMMDD_HHMMSS.sql

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

#### 2. Database Performance Issues
```bash
# Check database connections
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT * FROM pg_stat_activity;"

# Kill long-running queries
docker-compose -f docker-compose.prod.yml exec db psql -U kennel_user kennel_prod -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"

# Restart database if needed
docker-compose -f docker-compose.prod.yml restart db
```

### Application Recovery

#### 1. Application Crash
```bash
# Check application status
docker-compose -f docker-compose.prod.yml ps app

# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Check application logs
docker-compose -f docker-compose.prod.yml logs app --tail=100
```

#### 2. Memory Issues
```bash
# Check memory usage
docker stats

# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Check memory after restart
docker stats
```

### Security Recovery

#### 1. Security Breach
```bash
# Immediate actions
# 1. Change all passwords
# 2. Rotate all keys
# 3. Review access logs
# 4. Implement additional security measures

# Change passwords
docker-compose -f docker-compose.prod.yml exec app pnpm db:password:reset

# Rotate keys
# Update environment variables
# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### 2. DDoS Attack
```bash
# Check traffic
netstat -an | grep :80 | wc -l

# Implement rate limiting
# Update Nginx configuration
# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Post-Incident Review

### Review Process

#### 1. Immediate Review (24 hours)
- **Incident Summary**: What happened?
- **Root Cause**: Why did it happen?
- **Response Time**: How quickly did we respond?
- **Resolution Time**: How quickly did we resolve?
- **Impact**: What was the impact on users?

#### 2. Detailed Review (1 week)
- **Timeline**: Detailed timeline of events
- **Actions**: All actions taken
- **Decisions**: All decisions made
- **Lessons Learned**: What did we learn?
- **Improvements**: What can we improve?

#### 3. Follow-up Actions (2 weeks)
- **Prevention**: Measures to prevent recurrence
- **Process Improvements**: Changes to procedures
- **Training**: Additional training needed
- **Documentation**: Updates to documentation

### Review Template

```markdown
# Incident Review: [Incident ID]

## Incident Summary
- **Date**: [Date]
- **Time**: [Time]
- **Duration**: [Duration]
- **Severity**: [P1/P2/P3/P4]
- **Impact**: [Description]

## Root Cause
[Detailed analysis of root cause]

## Timeline
- **Detection**: [Time]
- **Response**: [Time]
- **Resolution**: [Time]
- **Verification**: [Time]

## Actions Taken
1. [Action 1]
2. [Action 2]
3. [Action 3]

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

## Improvements
1. [Improvement 1]
2. [Improvement 2]
3. [Improvement 3]

## Follow-up Actions
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

## Prevention Measures

### Proactive Monitoring

#### 1. Health Checks
- **Application Health**: Every 1 minute
- **Database Health**: Every 1 minute
- **Redis Health**: Every 1 minute
- **System Health**: Every 5 minutes

#### 2. Performance Monitoring
- **Response Times**: Alert if > 2 seconds
- **Error Rates**: Alert if > 1%
- **Database Performance**: Alert if slow queries
- **Memory Usage**: Alert if > 80%

#### 3. Security Monitoring
- **Failed Logins**: Alert if > 5 per minute
- **Suspicious Activity**: Alert on anomalies
- **Rate Limiting**: Alert if limits exceeded
- **SSL Certificates**: Alert if expiring

### Regular Maintenance

#### 1. Daily
- **Health Check Review**: Review all health checks
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

### Training and Documentation

#### 1. Team Training
- **Incident Response**: Regular training sessions
- **Technical Skills**: Keep skills up to date
- **Security Awareness**: Security training
- **Communication**: Communication training

#### 2. Documentation
- **Procedures**: Keep procedures up to date
- **Runbooks**: Update runbooks regularly
- **Contact Information**: Keep contacts current
- **Escalation Procedures**: Review escalation procedures

## Conclusion

This incident response playbook provides comprehensive procedures for responding to incidents in the Kennel Management System. Regular review and updates ensure the procedures remain effective and relevant.

The key to successful incident response is preparation, rapid response, clear communication, and continuous improvement based on lessons learned.
