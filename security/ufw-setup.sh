#!/bin/bash

# UFW Firewall Setup Script
# This script configures UFW firewall for the kennel management system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Reset UFW to defaults
log_info "Resetting UFW to defaults..."
ufw --force reset

# Set default policies
log_info "Setting default policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (be careful with this)
log_info "Allowing SSH..."
ufw allow ssh

# Allow HTTP and HTTPS
log_info "Allowing HTTP and HTTPS..."
ufw allow 80/tcp
ufw allow 443/tcp

# Allow monitoring ports (internal only)
log_info "Allowing monitoring ports..."
ufw allow from 172.20.0.0/16 to any port 9090  # Prometheus
ufw allow from 172.20.0.0/16 to any port 3001  # Grafana
ufw allow from 172.20.0.0/16 to any port 3100  # Loki

# Deny direct database access from outside
log_info "Blocking direct database access..."
ufw deny 5432/tcp
ufw deny 6379/tcp

# Enable UFW
log_info "Enabling UFW firewall..."
ufw --force enable

log_info "UFW firewall configuration completed!"
log_info "Current status:"
ufw status verbose
