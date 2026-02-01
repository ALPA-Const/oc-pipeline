#!/bin/bash

################################################################################
# AWS EC2 Application Deployment Script
# Deploys the AutoGPT system to an EC2 instance
################################################################################

set -e  # Exit on error

echo "=========================================="
echo "  Application Deployment Script"
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

# Configuration
APP_DIR="/var/www/oc-pipeline"
FRONTEND_DIR="$APP_DIR/frontend"
BACKUP_DIR="/var/backups/oc-pipeline"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if running on EC2
print_info "Starting deployment process..."
echo ""

# Step 1: Backup existing deployment
if [ -d "$FRONTEND_DIR/dist" ]; then
    echo "Step 1: Backing up existing deployment..."
    echo "-----------------------------------"
    sudo mkdir -p $BACKUP_DIR
    sudo tar -czf $BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz $FRONTEND_DIR/dist
    print_success "Backup created: $BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz"
    echo ""
else
    print_info "No existing deployment found, skipping backup"
    echo ""
fi

# Step 2: Check if repository exists
echo "Step 2: Checking repository..."
echo "-----------------------------------"
if [ -d "$APP_DIR" ]; then
    print_info "Repository found, pulling latest changes..."
    cd $APP_DIR
    git pull origin main || git pull origin master
    print_success "Repository updated"
else
    print_info "Cloning repository..."
    sudo mkdir -p /var/www
    sudo chown -R $USER:$USER /var/www
    cd /var/www
    git clone https://github.com/ALPA-Const/oc-pipeline.git
    print_success "Repository cloned"
fi
echo ""

# Step 3: Check environment variables
echo "Step 3: Checking environment configuration..."
echo "-----------------------------------"
cd $FRONTEND_DIR

if [ ! -f ".env.production" ]; then
    print_warning "Environment file not found!"
    print_info "Creating template .env.production file..."
    
    cat > .env.production << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration (optional)
VITE_API_URL=https://your-api-url.com

# Environment
NODE_ENV=production
EOF
    
    print_warning "Please edit .env.production with your actual credentials"
    print_info "Run: nano $FRONTEND_DIR/.env.production"
    echo ""
    read -p "Press Enter after updating .env.production to continue..."
else
    print_success "Environment file found"
fi
echo ""

# Step 4: Install dependencies
echo "Step 4: Installing dependencies..."
echo "-----------------------------------"
cd $FRONTEND_DIR
npm install
print_success "Dependencies installed"
echo ""

# Step 5: Run build
echo "Step 5: Building application..."
echo "-----------------------------------"
npm run build

if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist | cut -f1)
    print_success "Build completed successfully!"
    print_info "Build size: $BUILD_SIZE"
else
    print_error "Build failed - dist directory not found"
    exit 1
fi
echo ""

# Step 6: Configure Nginx (if not already configured)
echo "Step 6: Checking Nginx configuration..."
echo "-----------------------------------"

if [ ! -f "/etc/nginx/sites-available/oc-pipeline" ]; then
    print_info "Creating Nginx configuration..."
    
    # Get server IP or domain
    read -p "Enter your domain name (or leave empty to use IP): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        # Use IP address
        DOMAIN=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        print_info "Using IP address: $DOMAIN"
    fi
    
    sudo bash -c "cat > /etc/nginx/sites-available/oc-pipeline << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    server_name $DOMAIN;
    
    root $FRONTEND_DIR/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;

    # Main location
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }

    # Error pages
    error_page 404 /index.html;
}
EOF"
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/oc-pipeline /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    print_success "Nginx configuration created"
else
    print_info "Nginx configuration already exists"
fi
echo ""

# Step 7: Reload Nginx
echo "Step 7: Reloading Nginx..."
echo "-----------------------------------"
sudo systemctl reload nginx
print_success "Nginx reloaded"
echo ""

# Step 8: Test deployment
echo "Step 8: Testing deployment..."
echo "-----------------------------------"

# Get server URL
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
    if [ $HTTP_CODE -eq 200 ]; then
        print_success "Application is responding (HTTP $HTTP_CODE)"
    else
        print_warning "Application returned HTTP $HTTP_CODE"
    fi
else
    print_info "curl not found, skipping HTTP test"
fi
echo ""

# Step 9: Display deployment info
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
print_success "Application deployed successfully!"
echo ""
print_info "Deployment details:"
print_info "  - Application directory: $FRONTEND_DIR"
print_info "  - Build directory: $FRONTEND_DIR/dist"
print_info "  - Build size: $BUILD_SIZE"
print_info "  - Backup: $BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz"
echo ""
print_info "Access your application:"

# Try to get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
if [ ! -z "$PUBLIC_IP" ]; then
    print_info "  - HTTP: http://$PUBLIC_IP"
fi
echo ""

print_warning "Next steps:"
echo "  1. Test the application in your browser"
echo "  2. Setup SSL certificate with: sudo certbot --nginx"
echo "  3. Configure domain DNS if using a custom domain"
echo "  4. Setup monitoring and backups"
echo ""
print_info "For troubleshooting, check logs:"
print_info "  - Nginx access: sudo tail -f /var/log/nginx/access.log"
print_info "  - Nginx errors: sudo tail -f /var/log/nginx/error.log"
echo ""
