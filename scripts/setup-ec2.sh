#!/bin/bash

# OC-Pipeline AWS EC2 Setup Script
# Automates the setup of OC-Pipeline on Ubuntu 22.04 EC2 instance

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

print_info "Starting OC-Pipeline EC2 Setup..."
echo ""

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Install basic dependencies
print_info "Installing basic dependencies..."
sudo apt install -y curl wget git build-essential ufw
print_success "Basic dependencies installed"

# Install Node.js 20
print_info "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install Nginx
print_info "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    print_success "Nginx installed"
else
    print_success "Nginx already installed"
fi

# Install PM2
print_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup systemd -u ubuntu --hp /home/ubuntu
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Install Certbot (for SSL)
print_info "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
else
    print_success "Certbot already installed"
fi

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p /var/www/oc-pipeline
sudo chown -R ubuntu:ubuntu /var/www/oc-pipeline
print_success "Application directory created"

# Configure firewall
print_info "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
print_success "Firewall configured"

# Clone repository
print_info "Cloning repository..."
read -p "Enter GitHub repository URL (or press Enter for default): " REPO_URL
REPO_URL=${REPO_URL:-https://github.com/ALPA-Const/oc-pipeline.git}

if [ -d "/var/www/oc-pipeline/.git" ]; then
    print_info "Repository already exists, pulling latest changes..."
    cd /var/www/oc-pipeline
    git pull origin main || git pull origin master
else
    git clone $REPO_URL /var/www/oc-pipeline
fi
print_success "Repository cloned/updated"

# Setup Backend
print_info "Setting up backend..."
cd /var/www/oc-pipeline/backend

# Prompt for environment variables
echo ""
print_info "Please provide backend environment variables:"
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -p "Database URL: " DATABASE_URL
read -sp "JWT Secret (press Enter to auto-generate): " JWT_SECRET
echo ""
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
read -p "Frontend URL (e.g., http://YOUR_IP or https://yourdomain.com): " FRONTEND_URL

# Create backend .env
cat > .env << EOF
PORT=3000
NODE_ENV=production

SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL=$DATABASE_URL

JWT_SECRET=$JWT_SECRET
JWT_ISSUER=oc-pipeline
JWT_AUDIENCE=authenticated

FRONTEND_URL=$FRONTEND_URL
ALLOWED_ORIGINS=$FRONTEND_URL,http://localhost:5173
EOF

print_success "Backend environment configured"

# Install backend dependencies and build
print_info "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

print_info "Building backend..."
npm run build
print_success "Backend built"

# Start backend with PM2
print_info "Starting backend with PM2..."
pm2 delete oc-pipeline-backend 2>/dev/null || true
pm2 start dist/index.js --name oc-pipeline-backend
pm2 save
print_success "Backend started"

# Setup Frontend
print_info "Setting up frontend..."
cd /var/www/oc-pipeline/frontend

# Create frontend .env
cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_API_URL=${FRONTEND_URL}/api
EOF

print_success "Frontend environment configured"

# Install frontend dependencies and build
print_info "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

print_info "Building frontend..."
npm run build
print_success "Frontend built"

# Deploy frontend to Nginx
print_info "Deploying frontend..."
sudo mkdir -p /var/www/html/oc-pipeline
sudo cp -r dist/* /var/www/html/oc-pipeline/
sudo chown -R www-data:www-data /var/www/html/oc-pipeline
print_success "Frontend deployed"

# Configure Nginx
print_info "Configuring Nginx..."
read -p "Enter your domain name (or IP address): " DOMAIN_NAME

sudo tee /etc/nginx/sites-available/oc-pipeline > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    root /var/www/html/oc-pipeline;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/oc-pipeline /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_success "Nginx configuration valid"
    sudo systemctl restart nginx
    print_success "Nginx restarted"
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Setup SSL if domain is provided
if [[ $DOMAIN_NAME != *.*.*.* ]]; then
    read -p "Would you like to setup SSL certificate with Let's Encrypt? (y/n): " SETUP_SSL
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        print_info "Setting up SSL certificate..."
        read -p "Enter your email address for SSL certificate: " EMAIL
        sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL --redirect
        print_success "SSL certificate installed"
    fi
fi

# Create deployment script
print_info "Creating deployment script..."
cat > /var/www/oc-pipeline/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd /var/www/oc-pipeline
git pull origin main || git pull origin master

# Update Backend
echo "📦 Updating backend..."
cd backend
npm install --production
npm run build
pm2 restart oc-pipeline-backend

# Update Frontend
echo "🎨 Updating frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/oc-pipeline/*
sudo cp -r dist/* /var/www/html/oc-pipeline/
sudo chown -R www-data:www-data /var/www/html/oc-pipeline

echo "✅ Deployment complete!"
pm2 status
EOF

chmod +x /var/www/oc-pipeline/deploy.sh
print_success "Deployment script created"

# Create backup script
print_info "Creating backup script..."
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/oc-pipeline-$DATE.tar.gz /var/www/oc-pipeline
ls -t $BACKUP_DIR/oc-pipeline-*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: oc-pipeline-$DATE.tar.gz"
EOF

chmod +x /home/ubuntu/backup.sh

# Add backup to crontab
(crontab -l 2>/dev/null | grep -v backup.sh; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
print_success "Backup script created and scheduled"

# Print summary
echo ""
echo "============================================"
print_success "OC-Pipeline Setup Complete!"
echo "============================================"
echo ""
echo "📋 Summary:"
echo "  • Backend running on PM2: $(pm2 id oc-pipeline-backend)"
echo "  • Frontend deployed to: /var/www/html/oc-pipeline"
echo "  • Nginx configured for: $DOMAIN_NAME"
echo "  • Application URL: http://$DOMAIN_NAME"
echo ""
echo "📝 Next Steps:"
echo "  1. Verify backend: curl http://localhost:3000/health"
echo "  2. Access application: http://$DOMAIN_NAME"
echo "  3. Check PM2 logs: pm2 logs oc-pipeline-backend"
echo "  4. Monitor Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 Useful Commands:"
echo "  • Update deployment: /var/www/oc-pipeline/deploy.sh"
echo "  • Backup: /home/ubuntu/backup.sh"
echo "  • PM2 status: pm2 status"
echo "  • Restart backend: pm2 restart oc-pipeline-backend"
echo ""
print_success "Setup script completed successfully!"
