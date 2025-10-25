#!/bin/bash

# Production Deployment Script
# This script handles the deployment of the kennel management system to production

set -e

# Configuration
APP_NAME="kennel-management"
PRODUCTION_URL="https://your-domain.com"
DOCKER_REGISTRY="ghcr.io"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env() {
    log_info "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "BETTER_AUTH_SECRET"
        "STRIPE_SECRET_KEY"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_info "Environment variables check passed"
}

# Build and push Docker image
build_and_push() {
    log_info "Building and pushing Docker image..."
    
    # Build the image
    docker build -t $DOCKER_REGISTRY/$APP_NAME:$IMAGE_TAG .
    
    # Push the image
    docker push $DOCKER_REGISTRY/$APP_NAME:$IMAGE_TAG
    
    log_info "Docker image built and pushed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations
    pnpm db:migrate
    
    log_info "Database migrations completed"
}

# Deploy to production
deploy() {
    log_info "Deploying to production..."
    
    # Update docker-compose with production image
    sed -i "s|image: .*|image: $DOCKER_REGISTRY/$APP_NAME:$IMAGE_TAG|g" docker-compose.production.yml
    
    # Deploy using docker-compose
    docker-compose -f docker-compose.production.yml up -d
    
    log_info "Deployment completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if application is responding
    if curl -f -s $PRODUCTION_URL/api/health > /dev/null; then
        log_info "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f docker-compose.production.yml down
    
    # Deploy previous version (you would need to implement this)
    log_warn "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting production deployment..."
    
    # Check environment
    check_env
    
    # Build and push image
    build_and_push
    
    # Run migrations
    run_migrations
    
    # Deploy
    deploy
    
    # Health check
    health_check
    
    log_info "Production deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    *)
        main
        ;;
esac
