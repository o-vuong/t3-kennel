# 🚀 Kennel Management System - Setup Guide

This guide will help you set up the Kennel Management System on **macOS with zsh** in under 30 minutes.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm** package manager
- **PostgreSQL 15+** 
- **OrbStack** (provides Docker-compatible engine for PostgreSQL/Redis containers)
- **macOS** with **zsh** shell
- **Git** for version control

## Quick Start

### 1. Environment Setup

**Install Node.js using Homebrew:**
```zsh
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js LTS
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

**Install pnpm:**
```zsh
npm install -g pnpm@latest
pnpm --version  # Should show v10.x.x or higher
```

**Install OrbStack (Docker-compatible runtime):**
```zsh
brew install --cask orbstack
# Launch OrbStack once to finish setup and enable Docker integration
```

### 2. Project Setup

**Clone the repository:**
```zsh
cd ~/Projects  # Or your preferred development directory
git clone [repository-url]
cd t3-kennel
```

**Install dependencies:**
```zsh
pnpm install
```

### 3. Environment Configuration

**Create environment file:**
```zsh
cp .env.example .env
cp .env .env.local
```

Keep both files in sync—`.env` is consumed by local tooling like `./start-database.sh`, while `.env.local` is read by Next.js at runtime.

**Generate required secrets:**
```zsh
# Generate 32-character secrets using openssl; paste into both files
openssl rand -base64 32  # BETTER_AUTH_SECRET
openssl rand -base64 32  # ENCRYPTION_KEY
openssl rand -base64 32  # OVERRIDE_HMAC_SECRET
```

**Set base URLs (port 3001 matches the dev server):**  
Ensure `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` point to `http://localhost:3001` in both `.env` and `.env.local`. After editing `.env`, re-run `cp .env .env.local` to keep them aligned.

**Edit .env.local for your setup:**
```zsh
nano .env.local
# Update DATABASE_URL if different from default
# Configure rate limits (RATE_LIMIT_LOGIN_PER_MIN, RATE_LIMIT_API_PER_MIN)
# Update Redis (REDIS_URL) if using external Redis
# Add SMTP settings if you want email notifications
# Set OTEL_EXPORTER_OTLP_ENDPOINT if exporting telemetry
# Provide OAUTH_SMTP_FROM for templated mail sender if applicable
```

### 4. Database Setup

**Option A: start-database.sh helper (Recommended)**
```zsh
# Reads DATABASE_URL from .env and launches Postgres via OrbStack/Docker
./start-database.sh
```

The script checks for port conflicts, generates a password if needed, and reuses the same container on restart.

**Option B: Docker Compose (OrbStack)**
```zsh
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify containers are running
docker ps

# Check logs if needed
docker-compose logs postgres
docker-compose logs redis
```

> OrbStack exposes the standard `docker` and `docker-compose` CLIs. Launch the OrbStack app before running these commands.

**Option C: Manual PostgreSQL Setup**
```zsh
# Install PostgreSQL using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database and user
createdb t3-kennel
psql t3-kennel -c "CREATE USER kennel_user WITH PASSWORD 'your_password';"
psql t3-kennel -c "GRANT ALL PRIVILEGES ON DATABASE \"t3-kennel\" TO kennel_user;"

# Update .env.local with your database URL
echo "DATABASE_URL=\"postgresql://kennel_user:your_password@localhost:5432/t3-kennel\"" >> .env.local
```

### 5. Database Migration and Seeding

**Generate Prisma client:**
```zsh
pnpm db:generate
```

**Run database migrations:**
```zsh
pnpm db:migrate
```

**Seed the database with demo data:**
```zsh
pnpm db:seed
```

**Open Prisma Studio (optional):**
```zsh
pnpm db:studio
# Opens at http://localhost:5555
```

### 6. Development Server

**Start the development server:**
```zsh
pnpm dev
```

The application will be available at:
- **Main App**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (if running)

### 7. Verify Installation

**Check application health:**
```zsh
# In a new terminal window
curl http://localhost:3001/api/health
# Should return JSON with status information
```

**Test database connection:**
```zsh
pnpm typecheck  # Verify TypeScript compilation
pnpm check      # Run linting and formatting checks
```

## SMTP Configuration (Optional)

### Gmail Setup
```zsh
# Add to .env.local
echo "SMTP_HOST=\"smtp.gmail.com\"" >> .env.local
echo "SMTP_PORT=\"587\"" >> .env.local
echo "SMTP_USER=\"your-email@gmail.com\"" >> .env.local
echo "SMTP_PASS=\"your-app-password\"" >> .env.local
echo "OAUTH_SMTP_FROM=\"noreply@yourdomain.com\"" >> .env.local
```

**Generate Gmail App Password:**
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate app password for "Mail"
3. Use generated password in `SMTP_PASS`

### Other Email Providers
```zsh
# For SendGrid
echo "SMTP_HOST=\"smtp.sendgrid.net\"" >> .env.local
echo "SMTP_PORT=\"587\"" >> .env.local
echo "SMTP_USER=\"apikey\"" >> .env.local
echo "SMTP_PASS=\"your-sendgrid-api-key\"" >> .env.local

# For AWS SES
echo "SMTP_HOST=\"email-smtp.us-east-1.amazonaws.com\"" >> .env.local
echo "SMTP_PORT=\"587\"" >> .env.local
echo "SMTP_USER=\"your-ses-access-key\"" >> .env.local
echo "SMTP_PASS=\"your-ses-secret-key\"" >> .env.local
```

## VAPID Configuration for Web Push

**Generate VAPID keys:**
```zsh
# Install web-push CLI globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Add to .env.local
echo "VAPID_PUBLIC_KEY=\"[paste-public-key-here]\"" >> .env.local
echo "VAPID_PRIVATE_KEY=\"[paste-private-key-here]\"" >> .env.local
echo "VAPID_SUBJECT=\"mailto:admin@yourdomain.com\"" >> .env.local
echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=\"[paste-public-key-here]\"" >> .env.local
```

## MFA Configuration

Multi-factor authentication is automatically enabled for admin and owner accounts. No additional setup required.

**TOTP Support**: Works with Google Authenticator, Authy, 1Password, etc.
**WebAuthn Support**: Works with hardware security keys, Touch ID, Face ID

## PWA Configuration

The PWA (Progressive Web App) features are automatically configured:

**Service Worker**: Handles offline functionality and caching
**Web App Manifest**: Enables installation on mobile and desktop
**Background Sync**: Queues operations when offline

## Available Scripts

```zsh
# Development
pnpm dev                    # Start development server (Turbopack)
pnpm build                  # Production build
pnpm start                  # Production server
pnpm preview                # Build and start production server

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema changes to database
pnpm db:migrate             # Apply database migrations
pnpm db:seed                # Seed database with demo data
pnpm db:studio              # Open Prisma Studio

# Quality Assurance
pnpm check                  # Run Biome formatting and linting
pnpm check:write            # Apply safe fixes
pnpm check:unsafe           # Apply aggressive fixes
pnpm typecheck              # TypeScript type checking

# Testing (when implemented)
pnpm test                   # Run unit tests
pnpm test:e2e               # Run end-to-end tests
```

## Service Worker Updates

When the service worker updates, users will see an update prompt. To force an update during development:

```zsh
# Clear service worker cache
rm -rf .next/
pnpm dev
```

## Push Configuration Testing

**Test push notifications locally:**
```zsh
# Send test notification (after VAPID setup)
curl -X POST http://localhost:3001/api/push/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Test notification"}'
```

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```zsh
# Check if PostgreSQL is running
brew services list | grep postgresql
docker ps | grep postgres

# Reset database if corrupted
dropdb t3-kennel && createdb t3-kennel
pnpm db:migrate
pnpm db:seed
```

**Port Already in Use:**
```zsh
# Find process using port 3001
lsof -ti:3001

# Kill process if needed
kill -9 $(lsof -ti:3001)

# Or use different port
PORT=3002 pnpm dev
```

**Node Version Issues:**
```zsh
# Check Node version
node --version

# Install correct version
nvm install 20
nvm use 20
# Or with homebrew
brew install node@20
```

**Environment Variable Issues:**
```zsh
# Verify environment variables are loaded
node -e "console.log(process.env.DATABASE_URL)"

# Check for syntax errors in .env.local
cat .env.local | grep -v "^#" | grep "="
```

**Service Worker Issues:**
```zsh
# Clear Next.js cache
rm -rf .next/

# Clear browser cache (Chrome DevTools > Application > Storage > Clear site data)
# Or open in incognito mode for fresh state
```

### Getting Help

**Check application logs:**
```zsh
# Development server logs
pnpm dev --verbose

# Database logs
docker-compose logs -f postgres

# Check system logs for errors
tail -f /var/log/system.log | grep node
```

**Health check endpoints:**
```zsh
curl http://localhost:3001/api/health         # Overall health
curl http://localhost:3001/api/health/ready   # Readiness probe
```

## Production Deployment

For production deployment, see:
- [docs/DEPLOY.md](./DEPLOY.md) - Docker deployment guide
- [docs/security/RUNBOOK.md](./security/RUNBOOK.md) - Security procedures
- [docs/compliance/HIPAA.md](./compliance/HIPAA.md) - Compliance checklist

## Development Workflow

```zsh
# Typical development session
cd t3-kennel
git pull origin main            # Get latest changes
pnpm install                    # Install new dependencies
pnpm db:generate               # Update Prisma client if schema changed
pnpm db:migrate                # Apply any new migrations
pnpm dev                       # Start development

# Before committing
pnpm check                     # Format and lint
pnpm typecheck                 # Verify types
pnpm build                     # Verify production build works
```

## Next Steps

Once setup is complete:

1. **Login**: Visit http://localhost:3001 and use demo credentials from [DEMO_READY.md](../DEMO_READY.md)
2. **Explore**: Try different user roles (owner, admin, staff, customer)
3. **PWA**: Install the app on your mobile device or desktop
4. **Development**: Start implementing Phase 1 features (RLS, MFA, etc.)

## Support

For setup issues:
- Check [GitHub Issues](../../issues)
- Review [Architecture Documentation](../ARCHITECTURE.md)
- Contact the development team

---

**Setup Time**: ~15-30 minutes depending on download speeds and existing tools.
