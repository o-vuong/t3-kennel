# Deployment Runbook

This document provides comprehensive deployment procedures for the Kennel Management System, including initial setup, updates, rollbacks, and troubleshooting.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Deployment](#initial-deployment)
3. [Update Deployment](#update-deployment)
4. [Rollback Procedures](#rollback-procedures)
5. [Database Migrations](#database-migrations)
6. [Environment Management](#environment-management)
7. [Monitoring and Health Checks](#monitoring-and-health-checks)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Procedures](#emergency-procedures)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum SSD
- **Network**: Stable internet connection

### Software Dependencies

- Docker 24.0+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 20+ (for development)
- pnpm 9+ (for development)

### External Services

- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Email**: SMTP service (SendGrid recommended)
- **Payments**: Stripe account
- **Monitoring**: Sentry account
- **Domain**: SSL certificate

## Initial Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/t3-kennel.git
cd t3-kennel

# Checkout production branch
git checkout main
```

### 3. Environment Configuration

```bash
# Copy production environment template
cp env.production .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://kennel_user:secure_password@db:5432/kennel_prod

# Redis
REDIS_URL=redis://redis:6379

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
OVERRIDE_HMAC_SECRET=your-32-character-hmac-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_live_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
OAUTH_SMTP_FROM=noreply@your-domain.com

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_APP_VERSION=1.0.0

# Rate Limiting
RATE_LIMIT_LOGIN_PER_MIN=5
RATE_LIMIT_API_PER_MIN=60

# Security
AUDIT_LOG_RETENTION_DAYS=2555
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Verify certificate
sudo certbot certificates
```

### 5. Deploy Application

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Database Setup

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate

# Seed initial data
docker-compose -f docker-compose.prod.yml exec app pnpm db:seed

# Verify database connection
docker-compose -f docker-compose.prod.yml exec app pnpm db:studio
```

### 7. Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Check readiness
curl https://your-domain.com/api/health/ready

# Check liveness
curl https://your-domain.com/api/health/live

# Check metrics
curl https://your-domain.com/api/metrics
```

## Update Deployment

### 1. Pre-deployment Checklist

- [ ] Backup database
- [ ] Test in staging environment
- [ ] Review changelog
- [ ] Notify users of maintenance window
- [ ] Prepare rollback plan

### 2. Update Process

```bash
# Pull latest changes
git fetch origin
git checkout main
git pull origin main

# Build new image
docker-compose -f docker-compose.prod.yml build

# Run database migrations (if any)
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate

# Deploy new version
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl https://your-domain.com/api/health
```

### 3. Post-deployment Verification

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Run health checks
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/api/health/live

# Check metrics
curl https://your-domain.com/api/metrics

# Test critical user flows
# - User login
# - Pet registration
# - Booking creation
# - Payment processing
```

## Rollback Procedures

### 1. Quick Rollback (Same Day)

```bash
# Stop current services
docker-compose -f docker-compose.prod.yml down

# Revert to previous commit
git checkout HEAD~1

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verify rollback
curl https://your-domain.com/api/health
```

### 2. Database Rollback

```bash
# List available migrations
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Rollback to specific migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate rollback

# Verify database state
docker-compose -f docker-compose.prod.yml exec app pnpm db:studio
```

### 3. Full System Rollback

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove current images
docker-compose -f docker-compose.prod.yml down --rmi all

# Restore from backup
# (Follow backup restoration procedures)

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Verify system
curl https://your-domain.com/api/health
```

## Database Migrations

### 1. Creating Migrations

```bash
# Create new migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:generate

# Review generated migration
cat prisma/migrations/$(ls -t prisma/migrations/ | head -1)/migration.sql

# Test migration locally
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate
```

### 2. Applying Migrations

```bash
# Check migration status
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Apply pending migrations
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate

# Verify migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:studio
```

### 3. Migration Rollback

```bash
# List migration history
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate status

# Rollback last migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate rollback

# Rollback to specific migration
docker-compose -f docker-compose.prod.yml exec app pnpm db:migrate rollback --target MIGRATION_NAME
```

## Environment Management

### 1. Staging Environment

```bash
# Deploy to staging
git checkout develop
docker-compose -f docker-compose.staging.yml up -d

# Run staging tests
docker-compose -f docker-compose.staging.yml exec app pnpm test
docker-compose -f docker-compose.staging.yml exec app pnpm test:e2e
```

### 2. Production Environment

```bash
# Deploy to production
git checkout main
docker-compose -f docker-compose.prod.yml up -d

# Monitor production
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Environment Variables

```bash
# Update environment variables
nano .env

# Restart services to apply changes
docker-compose -f docker-compose.prod.yml restart

# Verify configuration
docker-compose -f docker-compose.prod.yml exec app printenv | grep -E "(DATABASE_URL|REDIS_URL|STRIPE)"
```

## Monitoring and Health Checks

### 1. Health Endpoints

- **Health**: `GET /api/health` - Overall system health
- **Readiness**: `GET /api/health/ready` - Service readiness
- **Liveness**: `GET /api/health/live` - Service liveness
- **Metrics**: `GET /api/metrics` - Prometheus metrics

### 2. Monitoring Setup

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
iotop
nethogs

# Monitor Docker containers
docker stats
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs app

# View database logs
docker-compose -f docker-compose.prod.yml logs db

# View Redis logs
docker-compose -f docker-compose.prod.yml logs redis

# View Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

## Troubleshooting

### 1. Common Issues

#### Application Won't Start

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app printenv

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test connection
docker-compose -f docker-compose.prod.yml exec app pnpm db:studio
```

#### Redis Connection Issues

```bash
# Check Redis status
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis

# Test connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli info
```

### 2. Performance Issues

```bash
# Check system resources
htop
df -h
free -h

# Check Docker resource usage
docker stats

# Check application metrics
curl https://your-domain.com/api/metrics
```

### 3. Security Issues

```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check security headers
curl -I https://your-domain.com

# Check rate limiting
curl -I https://your-domain.com/api/health
```

## Emergency Procedures

### 1. Service Outage

```bash
# Immediate response
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. Database Corruption

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Restore from backup
# (Follow backup restoration procedures)

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

### 3. Security Breach

```bash
# Immediate response
docker-compose -f docker-compose.prod.yml down

# Change all passwords and keys
# Update environment variables
nano .env

# Restart with new credentials
docker-compose -f docker-compose.prod.yml up -d

# Monitor for suspicious activity
docker-compose -f docker-compose.prod.yml logs -f
```

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U kennel_user kennel_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql

# Store backup securely
# (Upload to secure storage)
```

### 2. Database Recovery

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Restore from backup
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U kennel_user kennel_prod < backup_YYYYMMDD_HHMMSS.sql

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

### 3. Full System Backup

```bash
# Create system backup
tar -czf system_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  docker-compose.prod.yml \
  .env \
  prisma/ \
  docs/ \
  scripts/

# Store backup securely
# (Upload to secure storage)
```

## Maintenance Windows

### 1. Scheduled Maintenance

- **Frequency**: Monthly
- **Duration**: 2 hours
- **Time**: 2:00 AM - 4:00 AM UTC
- **Notifications**: 48 hours advance notice

### 2. Emergency Maintenance

- **Duration**: As needed
- **Notifications**: Immediate
- **Communication**: Status page updates

### 3. Maintenance Checklist

- [ ] Notify users
- [ ] Backup system
- [ ] Apply updates
- [ ] Run health checks
- [ ] Monitor system
- [ ] Notify completion

## Contact Information

- **On-call Engineer**: +1-555-0123
- **System Administrator**: admin@kennel.app
- **Emergency Contact**: +1-555-9999
- **Status Page**: https://status.kennel.app

## Documentation Updates

This deployment runbook should be updated whenever:
- New deployment procedures are added
- Environment configurations change
- New monitoring tools are implemented
- Emergency procedures are modified

Last updated: $(date)
Version: 1.0.0
