#!/bin/bash

# Automated Security Updates Script
# This script handles automated security updates for the system

set -e

# Configuration
LOG_FILE="/var/log/auto-updates.log"
EMAIL_NOTIFICATIONS="admin@your-domain.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "$(date): [INFO] $1" >> "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "$(date): [WARN] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date): [ERROR] $1" >> "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
fi

# Update package lists
log_info "Updating package lists..."
apt update

# Check for security updates
log_info "Checking for security updates..."
security_updates=$(apt list --upgradable 2>/dev/null | grep -c "security" || true)

if [ "$security_updates" -gt 0 ]; then
    log_info "Found $security_updates security updates"
    
    # Install security updates
    log_info "Installing security updates..."
    apt upgrade -y --only-upgrade-security
    
    # Send notification email
    if command -v mail >/dev/null 2>&1; then
        echo "Security updates installed on $(hostname) at $(date)" | mail -s "Security Updates Applied" "$EMAIL_NOTIFICATIONS"
    fi
    
    log_info "Security updates completed"
else
    log_info "No security updates available"
fi

# Clean up old packages
log_info "Cleaning up old packages..."
apt autoremove -y
apt autoclean

# Update Docker images if Docker is installed
if command -v docker >/dev/null 2>&1; then
    log_info "Updating Docker images..."
    docker system prune -f
fi

log_info "Automated updates completed"
