#!/bin/bash

################################################################################
# AWS EC2 Setup Script for AutoGPT System
# This script automates the initial server configuration on a fresh EC2 instance
################################################################################

set -e  # Exit on error

echo "=========================================="
echo "  AWS EC2 Server Setup Script"
echo "  AutoGPT Construction Pipeline System"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as ubuntu user."
    exit 1
fi

print_info "Starting EC2 server setup..."
echo ""

# Step 1: Update system
echo "Step 1: Updating system packages..."
echo "-----------------------------------"
sudo apt update
sudo apt upgrade -y
print_success "System updated"
echo ""

# Step 2: Install essential tools
echo "Step 2: Installing essential tools..."
echo "-----------------------------------"
sudo apt install -y curl wget git build-essential
print_success "Essential tools installed"
echo ""

# Step 3: Install Node.js 20.x
echo "Step 3: Installing Node.js 20.x..."
echo "-----------------------------------"
if command -v node &> /dev/null; then
    print_info "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
fi
echo ""

# Step 4: Install Nginx
echo "Step 4: Installing Nginx..."
echo "-----------------------------------"
if command -v nginx &> /dev/null; then
    print_info "Nginx already installed"
else
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
fi
echo ""

# Step 5: Install PM2
echo "Step 5: Installing PM2 process manager..."
echo "-----------------------------------"
if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed: $(pm2 --version)"
else
    sudo npm install -g pm2
    print_success "PM2 installed: $(pm2 --version)"
fi
echo ""

# Step 6: Configure PM2 startup
echo "Step 6: Configuring PM2 startup..."
echo "-----------------------------------"
pm2 startup | grep "sudo" | bash || print_info "PM2 startup already configured"
print_success "PM2 startup configured"
echo ""

# Step 7: Configure firewall
echo "Step 7: Configuring UFW firewall..."
echo "-----------------------------------"
if sudo ufw status | grep -q "Status: active"; then
    print_info "UFW already active"
else
    sudo ufw --force enable
fi
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
print_success "Firewall configured"
echo ""

# Step 8: Create application directory
echo "Step 8: Setting up application directory..."
echo "-----------------------------------"
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
print_success "Application directory created: /var/www"
echo ""

# Step 9: Install Certbot (for SSL)
echo "Step 9: Installing Certbot for SSL..."
echo "-----------------------------------"
if command -v certbot &> /dev/null; then
    print_info "Certbot already installed"
else
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
fi
echo ""

# Step 10: Display system information
echo "Step 10: System Information"
echo "-----------------------------------"
print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"
print_info "Nginx version: $(nginx -v 2>&1)"
print_info "PM2 version: $(pm2 --version)"
print_info "Git version: $(git --version)"
echo ""

# Step 11: Display next steps
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
print_success "EC2 server is now ready for application deployment"
echo ""
print_info "Next steps:"
echo "  1. Clone your repository to /var/www/"
echo "  2. Configure environment variables"
echo "  3. Build the application"
echo "  4. Configure Nginx"
echo "  5. Setup SSL certificate with Certbot"
echo ""
print_info "For detailed instructions, see: AWS_EC2_DEPLOYMENT.md"
echo ""
print_warning "Important: Remember to configure your .env.production file with Supabase credentials"
echo ""
