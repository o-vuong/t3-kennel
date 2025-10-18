#!/bin/bash

# Demo Setup Script for Kennel Management System
echo "🐕 Setting up Kennel Management System for Demo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Database setup will be skipped."
        SKIP_DB=true
    else
        SKIP_DB=false
    fi
    
    print_success "Dependencies check completed"
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
# Demo Environment Configuration
DATABASE_URL="postgresql://kennel_user:kennel_password@localhost:5432/kennel_management"

# Better Auth Configuration
BETTER_AUTH_SECRET="demo-secret-key-32-chars-long-123456789"
BETTER_AUTH_URL="http://localhost:3000"

# Public URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Stripe Configuration (Demo Keys)
STRIPE_SECRET_KEY="sk_test_demo_stripe_secret_key_for_testing"
STRIPE_WEBHOOK_SECRET="whsec_demo_webhook_secret_for_testing"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_demo_stripe_publishable_key_for_testing"

# Security Configuration
ENCRYPTION_KEY="demo-encryption-key-32-chars-long-123456"
AUDIT_LOG_RETENTION_DAYS="2555"

# Environment
NODE_ENV="development"
SKIP_ENV_VALIDATION="false"
EOF
        print_success "Environment file created"
    else
        print_warning "Environment file already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Setup database with Docker
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        print_warning "Skipping database setup (Docker not available)"
        return
    fi
    
    print_status "Setting up PostgreSQL database with Docker..."
    
    # Create init script for database
    cat > init-db.sql << EOF
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE kennel_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kennel_management')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE kennel_management TO kennel_user;
EOF
    
    # Start PostgreSQL container
    docker run -d \
        --name kennel-postgres \
        -e POSTGRES_DB=kennel_management \
        -e POSTGRES_USER=kennel_user \
        -e POSTGRES_PASSWORD=kennel_password \
        -p 5432:5432 \
        -v kennel_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Test connection
    until docker exec kennel-postgres pg_isready -U kennel_user -d kennel_management; do
        print_status "Waiting for database connection..."
        sleep 2
    done
    
    print_success "Database is ready"
}

# Generate Prisma client and run migrations
setup_database_schema() {
    print_status "Setting up database schema..."
    
    # Generate Prisma client
    pnpm exec prisma generate
    
    # Run migrations
    pnpm exec prisma migrate dev --name init
    
    print_success "Database schema created"
}

# Seed database with demo data
seed_database() {
    print_status "Seeding database with demo data..."
    pnpm exec prisma db seed
    print_success "Database seeded with demo data"
}

# Build the application
build_application() {
    print_status "Building application..."
    pnpm run build
    print_success "Application built successfully"
}

# Display demo information
show_demo_info() {
    echo ""
    echo "🎉 Demo Setup Complete!"
    echo ""
    echo "📋 Demo Login Credentials:"
    echo "  👑 Owner:    owner@kennel.com"
    echo "  👨‍💼 Admin:    admin@kennel.com"
    echo "  👨‍🔧 Staff:    staff@kennel.com"
    echo "  👤 Customer: customer@example.com"
    echo ""
    echo "🚀 To start the demo:"
    echo "  pnpm dev"
    echo ""
    echo "🌐 Application will be available at:"
    echo "  http://localhost:3000"
    echo ""
    echo "📱 PWA Features:"
    echo "  - Install as app on mobile/desktop"
    echo "  - Offline functionality"
    echo "  - Background sync"
    echo "  - Push notifications"
    echo ""
    echo "🔐 Security Features:"
    echo "  - HIPAA-compliant data protection"
    echo "  - Role-based access control"
    echo "  - Audit logging"
    echo "  - PHI encryption"
    echo ""
    echo "📊 Demo Data Includes:"
    echo "  - 4 kennels (Small, Medium, Large, XL)"
    echo "  - 3 sample pets"
    echo "  - 2 sample bookings"
    echo "  - Care logs and notifications"
    echo ""
}

# Main execution
main() {
    echo "Starting demo setup..."
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    
    if [ "$SKIP_DB" = false ]; then
        setup_database
        setup_database_schema
        seed_database
    else
        print_warning "Please set up PostgreSQL manually and update DATABASE_URL in .env.local"
    fi
    
    build_application
    show_demo_info
}

# Run main function
main
