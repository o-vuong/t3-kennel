# 🐕 Kennel Management System

A production-ready, HIPAA-compliant Progressive Web Application (PWA) for managing dog kennel operations with role-based access control and offline functionality.

## 🏗️ Architecture

### Core Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Authentication**: Better Auth with MFA support
- **Database**: PostgreSQL with Prisma ORM
- **API**: Next.js Route Handlers + tRPC
- **PWA**: Manifest + Service Worker with Background Sync
- **Payments**: Stripe (PCI-compliant)
- **Security**: HIPAA-level protection with audit logging

### Key Features
- 🔐 **Role-based Access Control**: Owner > Admin > Staff > Customer hierarchy
- 📱 **Offline-first PWA**: Works without internet connection
- 🛡️ **HIPAA Compliance**: PHI protection and audit trails
- 💳 **Stripe Integration**: Secure payment processing
- 🔄 **Background Sync**: Queue operations when offline
- 📊 **Real-time Updates**: Web Push notifications
- 🎯 **DRY CRUD Factory**: Consistent data operations with audit logging

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL 15+
- Docker (optional)

### 1. Clone and Install
```bash
git clone <repository-url>
cd t3-kennel
pnpm install
```

### 2. Environment Setup
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev

# Seed database (optional)
pnpm exec prisma db seed
```

### 4. Development
```bash
pnpm dev
```

Visit `http://localhost:3000` and you'll be redirected to the login page.

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build image
docker build -t kennel-management .

# Run container
docker run -p 3000:3000 --env-file .env.local kennel-management
```

## 🔐 Authentication & Roles

### User Roles
- **Owner**: Full system access, can override all policies
- **Admin**: User management, reports, refunds, system configuration
- **Staff**: Booking operations, care logs, customer service
- **Customer**: Self-service pet management and bookings

### Role-based Routing
- `/owner/*` - Owner control panel
- `/admin/*` - Admin dashboard
- `/staff/*` - Staff operations
- `/customer/*` - Customer portal

## 📱 PWA Features

### Offline Functionality
- Service Worker with cache-first strategies
- Background Sync for queued operations
- IndexedDB for offline data storage
- Network-first API calls with fallback
- Automatic idempotency keys for offline mutations
- In-app update prompt when new service worker version is available

### Installation
- Installable on mobile and desktop
- App shortcuts for quick actions
- Offline page for connectivity issues
- Automatic updates with user prompts

## 🛡️ Security Features

### HIPAA Compliance
- PHI data encryption at rest and in transit
- Comprehensive audit logging
- Role-based access controls
- Session management with rotation
- Secure cookie configuration

### Security Headers
- Content Security Policy (CSP)
- HSTS with preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions Policy restrictions

### Authentication Security
- MFA for admin and owner roles
- Rate limiting on login attempts
- Session rotation every 30 minutes
- Secure token handling
- CSRF protection

## 📊 Data Models

### Core Entities
- **User**: Authentication and profile data
- **Pet**: Animal information and medical records
- **Kennel**: Available kennel spaces and pricing
- **Booking**: Reservation data with status tracking
- **CareLog**: Daily care activities and notes
- **AuditLog**: Security and compliance logging
- **OverrideEvent**: Policy bypass tracking

### Audit Trail
All data modifications are automatically logged with:
- Actor identification
- Action type and timestamp
- Target entity and changes
- IP address and user agent
- Override events and approvals

## 🔄 CRUD Operations

### DRY Factory Pattern
The system uses a generic CRUD factory that provides:
- Consistent input validation
- Role-based access control
- Automatic audit logging
- PHI data redaction
- Override token validation

### Example Usage
```typescript
const bookingFactory = new CrudFactory(
  db,
  "booking",
  AuditAction.CREATE,
  bookingPolicy,
  ["paymentInfo", "medicalNotes"] // Redacted fields
);

const result = await bookingFactory.create(session, bookingData);
```

## 💳 Payment Integration

### Stripe Setup
1. Create Stripe account and get API keys
2. Configure webhook endpoints
3. Set up payment intents and subscriptions
4. Enable PCI compliance features

### Payment Flow
- Secure payment intent creation
- Client-side payment confirmation
- Webhook validation and processing
- Automatic invoice generation
- Refund processing with admin approval

## 📧 Notifications

### Email Notifications
- Booking confirmations
- Payment receipts
- Care updates
- System alerts

### Web Push Notifications
- Real-time updates
- Offline notification queuing
- VAPID key configuration
- User subscription management

## 🔧 Development

### Code Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/ui/          # Reusable UI components
├── lib/
│   ├── auth/              # Better Auth configuration
│   ├── crud/              # DRY CRUD factory
│   └── utils/             # Utility functions
├── server/
│   ├── api/               # tRPC routers
│   └── db.ts              # Prisma client
└── styles/                # Global styles
```

### Scripts
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # Code linting
pnpm type-check   # TypeScript checking
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

### Security Testing
- Automated vulnerability scanning
- Penetration testing checklist
- HIPAA compliance audit
- Security header validation

## 📈 Monitoring & Observability

### Health Checks
- Database connectivity
- Service dependencies
- Application performance
- Security metrics

### Logging
- Structured JSON logging
- Audit trail preservation
- Error tracking and alerting
- Performance monitoring

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security headers verified
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] HIPAA compliance validated

### Cloud Providers
- **Fly.io**: Single-command deployment
- **Vercel**: Serverless deployment
- **AWS ECS**: Container orchestration
- **Google Cloud Run**: Serverless containers

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Booking Endpoints
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Pet Management
- `GET /api/pets` - List user's pets
- `POST /api/pets` - Add new pet
- `PATCH /api/pets/:id` - Update pet info
- `DELETE /api/pets/:id` - Remove pet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits
- Security-first approach

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review security guidelines
- Contact the development team

---

**⚠️ Security Notice**: This application handles sensitive data. Ensure proper security measures are in place before deployment to production.
