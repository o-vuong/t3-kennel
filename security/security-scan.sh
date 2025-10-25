#!/bin/bash

# Security Scan Script
# This script performs various security checks on the system

set -e

# Configuration
LOG_FILE="/var/log/security-scan.log"
REPORT_FILE="/var/log/security-report.txt"

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

# Initialize report
echo "Security Scan Report - $(date)" > "$REPORT_FILE"
echo "=================================" >> "$REPORT_FILE"

# Check for failed login attempts
log_info "Checking for failed login attempts..."
failed_logins=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l || echo "0")
if [ "$failed_logins" -gt 10 ]; then
    log_warn "High number of failed login attempts: $failed_logins"
    echo "WARNING: High number of failed login attempts: $failed_logins" >> "$REPORT_FILE"
else
    log_info "Failed login attempts: $failed_logins"
    echo "INFO: Failed login attempts: $failed_logins" >> "$REPORT_FILE"
fi

# Check for suspicious processes
log_info "Checking for suspicious processes..."
suspicious_processes=$(ps aux | grep -E "(nc|netcat|nmap|masscan)" | grep -v grep | wc -l)
if [ "$suspicious_processes" -gt 0 ]; then
    log_warn "Suspicious processes detected: $suspicious_processes"
    echo "WARNING: Suspicious processes detected" >> "$REPORT_FILE"
    ps aux | grep -E "(nc|netcat|nmap|masscan)" | grep -v grep >> "$REPORT_FILE"
else
    log_info "No suspicious processes detected"
    echo "INFO: No suspicious processes detected" >> "$REPORT_FILE"
fi

# Check disk usage
log_info "Checking disk usage..."
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
    log_warn "High disk usage: ${disk_usage}%"
    echo "WARNING: High disk usage: ${disk_usage}%" >> "$REPORT_FILE"
else
    log_info "Disk usage: ${disk_usage}%"
    echo "INFO: Disk usage: ${disk_usage}%" >> "$REPORT_FILE"
fi

# Check for open ports
log_info "Checking open ports..."
open_ports=$(netstat -tlnp | grep LISTEN | wc -l)
log_info "Open ports: $open_ports"
echo "INFO: Open ports: $open_ports" >> "$REPORT_FILE"

# Check for rootkits (if rkhunter is installed)
if command -v rkhunter >/dev/null 2>&1; then
    log_info "Running rootkit scan..."
    rkhunter --check --skip-keypress --report-warnings-only >> "$REPORT_FILE" 2>&1
else
    log_warn "rkhunter not installed - skipping rootkit scan"
    echo "WARNING: rkhunter not installed" >> "$REPORT_FILE"
fi

# Check for malware (if clamav is installed)
if command -v clamscan >/dev/null 2>&1; then
    log_info "Running malware scan..."
    clamscan -r /var/www /home --infected --remove=yes >> "$REPORT_FILE" 2>&1
else
    log_warn "clamav not installed - skipping malware scan"
    echo "WARNING: clamav not installed" >> "$REPORT_FILE"
fi

log_info "Security scan completed. Report saved to $REPORT_FILE"
