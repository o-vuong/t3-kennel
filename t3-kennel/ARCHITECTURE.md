# 🏗️ Kennel Management System Architecture

## System Overview

The Kennel Management System is a HIPAA-compliant Progressive Web Application built with modern technologies and security-first principles.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js PWA (React 19 + TypeScript + Tailwind CSS)           │
│  ├── Authentication (Better Auth)                              │
│  ├── Service Worker (Offline-first)                           │
│  ├── IndexedDB (Local Storage)                                │
│  └── Web Push (Notifications)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router + tRPC                                     │
│  ├── Route Handlers (/api/*)                                   │
│  ├── Middleware (Auth + RBAC)                                  │
│  ├── CRUD Factory (DRY Pattern)                                │
│  └── Audit Logging                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC                              │
├─────────────────────────────────────────────────────────────────┤
│  ├── Role-based Access Control (Owner > Admin > Staff > Customer) │
│  ├── Policy Enforcement                                        │
│  ├── Override Token System                                     │
│  ├── PHI Data Redaction                                        │
│  └── HIPAA Compliance                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL + Prisma ORM                                       │
│  ├── Row Level Security (RLS)                                  │
│  ├── Audit Tables                                              │
│  ├── Encryption at Rest                                        │
│  └── Backup & Recovery                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ├── Stripe (Payments)                                         │
│  ├── SMTP (Email Notifications)                                │
│  ├── VAPID (Web Push)                                          │
│  └── Docker (Containerization)                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

- **Authentication**: Better Auth with MFA support
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: React Query (TanStack Query)
- **Routing**: Next.js App Router with role-based guards
- **PWA Features**: Service Worker, Manifest, Background Sync

### Backend Components

- **API Layer**: Next.js Route Handlers + tRPC
- **Authentication**: Better Auth server configuration
- **Database**: Prisma ORM with PostgreSQL
- **Security**: Middleware with RBAC enforcement
- **Audit**: Comprehensive logging system

### Security Architecture

- **Authentication**: Multi-factor authentication for admin/owner
- **Authorization**: Role-based access control with policy enforcement
- **Data Protection**: PHI encryption and redaction
- **Audit Trail**: Immutable logging with tamper detection
- **Network Security**: TLS 1.3, HSTS, CSP headers

## Data Flow

### User Authentication Flow

1. User visits `/login`
2. Better Auth validates credentials
3. Session created with role information
4. Middleware redirects based on role:
   - Owner → `/owner/control`
   - Admin → `/admin/dashboard`
   - Staff → `/staff/overview`
   - Customer → `/customer/home`

### CRUD Operations Flow

1. Request comes to API endpoint
2. Middleware validates authentication
3. CRUD Factory checks permissions
4. Policy engine validates access
5. Database operation with audit logging
6. Response with redacted sensitive data

### Offline Operations Flow

1. User performs action while offline
2. Service Worker queues operation
3. IndexedDB stores pending changes
4. Background Sync processes when online
5. Conflict resolution and data sync

## Security Model

### Role Hierarchy

- **Owner**: Full system access, can override all policies
- **Admin**: User management, reports, refunds, system config
- **Staff**: Booking operations, care logs, customer service
- **Customer**: Self-service pet management and bookings

### Data Protection

- **Encryption**: AES-256 for data at rest, TLS 1.3 for transit
- **Access Control**: Row-level security in database
- **Audit Logging**: All operations logged with actor, action, timestamp
- **PHI Redaction**: Sensitive data removed from logs and exports

### Compliance Features

- **HIPAA Safeguards**: Administrative, physical, technical controls
- **Audit Trail**: 7-year retention with accessibility
- **Breach Detection**: Automated monitoring and alerting
- **Risk Assessment**: Annual security reviews

## Deployment Architecture

### Container Strategy

- **Single Docker Image**: Next.js standalone output
- **Multi-stage Build**: Optimized production image
- **Health Checks**: Database and service monitoring
- **Environment Variables**: Secure configuration management

### Scalability

- **Horizontal Scaling**: Stateless application design
- **Database Scaling**: Connection pooling and read replicas
- **CDN Integration**: Static asset optimization
- **Load Balancing**: Multiple instance deployment

### Monitoring & Observability

- **Health Endpoints**: `/api/health` for status checks
- **Structured Logging**: JSON format for analysis
- **Error Tracking**: Centralized error collection
- **Performance Metrics**: Response time and throughput monitoring

## Technology Stack

### Core Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: Better Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe

### Development Tools

- **Package Manager**: pnpm
- **Linting**: ESLint + Biome
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest + Playwright
- **Containerization**: Docker + Docker Compose

### Production Tools

- **Deployment**: Docker containers
- **Monitoring**: Health checks + logging
- **Security**: CSP, HSTS, rate limiting
- **Performance**: Service Worker caching

## API Design

### RESTful Endpoints

- `GET /api/bookings` - List bookings (role-filtered)
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/pets` - List user's pets
- `POST /api/pets` - Add new pet
- `GET /api/health` - Health check

### Authentication Endpoints

- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/verify-email` - Email verification

### Webhook Endpoints

- `POST /api/webhooks/stripe` - Payment processing
- `POST /api/webhooks/email` - Email delivery status

## Database Schema

### Core Entities

- **User**: Authentication and profile data
- **Pet**: Animal information and medical records
- **Kennel**: Available spaces and pricing
- **Booking**: Reservation data with status tracking
- **CareLog**: Daily care activities and notes

### Audit Entities

- **AuditLog**: Security and compliance logging
- **OverrideEvent**: Policy bypass tracking
- **ApprovalToken**: Temporary access tokens

### Security Features

- **Row Level Security**: Tenant isolation
- **Encryption**: Sensitive field protection
- **Indexing**: Performance optimization
- **Constraints**: Data integrity enforcement

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component
- **Service Worker**: Aggressive caching strategy
- **Bundle Analysis**: Size monitoring and optimization

### Backend Optimization

- **Database Indexing**: Query performance tuning
- **Connection Pooling**: Database connection management
- **Caching**: Redis for session and data caching
- **Compression**: Gzip/Brotli response compression

### PWA Performance

- **Cache Strategies**: Cache-first for static assets
- **Background Sync**: Offline operation queuing
- **Lighthouse Score**: Target 95+ for PWA metrics
- **Core Web Vitals**: Performance monitoring

## Security Checklist

### Authentication & Authorization

- [x] Multi-factor authentication for admin/owner
- [x] Role-based access control implementation
- [x] Session management with rotation
- [x] Secure password policies

### Data Protection

- [x] PHI encryption at rest and in transit
- [x] Input validation and sanitization
- [x] SQL injection prevention
- [x] XSS protection with CSP

### Infrastructure Security

- [x] HTTPS enforcement with HSTS
- [x] Security headers implementation
- [x] Rate limiting on API endpoints
- [x] Container security scanning

### Compliance

- [x] HIPAA administrative safeguards
- [x] Audit logging and retention
- [x] Breach detection and response
- [x] Risk assessment procedures

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security headers verified
- [ ] Health checks configured

### Post-deployment

- [ ] Monitoring dashboards active
- [ ] Backup procedures tested
- [ ] Incident response plan ready
- [ ] Performance metrics baseline
- [ ] Security scanning completed

This architecture provides a solid foundation for a production-ready, HIPAA-compliant kennel management system with modern security practices and scalable design patterns.
