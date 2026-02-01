# AWS EC2 Deployment Guide - AutoGPT System

## Overview

This guide provides step-by-step instructions for deploying the AutoGPT Construction Pipeline Management System to AWS EC2.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Server Configuration](#server-configuration)
4. [Application Deployment](#application-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### AWS Requirements
- AWS Account with billing enabled
- AWS CLI installed locally (optional but recommended)
- SSH key pair for EC2 access
- Domain name (optional, for SSL setup)

### Local Requirements
- Git installed
- SSH client
- Basic Linux command knowledge

### Recommended EC2 Instance
- **Type:** t3.medium or larger
- **OS:** Ubuntu 22.04 LTS (64-bit)
- **Storage:** 30 GB SSD minimum
- **RAM:** 4 GB minimum
- **vCPU:** 2 minimum

---

## EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Log into AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   ```
   Name: oc-pipeline-autogpt-prod
   AMI: Ubuntu Server 22.04 LTS
   Instance Type: t3.medium
   Key Pair: Create new or select existing
   ```

3. **Network Settings**
   - Create new security group or use existing
   - Enable the following ports:
     - SSH (22) - Your IP only
     - HTTP (80) - Anywhere (0.0.0.0/0)
     - HTTPS (443) - Anywhere (0.0.0.0/0)

4. **Storage Configuration**
   - Root volume: 30 GB gp3
   - Delete on termination: Yes

5. **Advanced Details** (Optional)
   - User data script: Leave empty for manual setup
   - IAM instance profile: None required for basic setup

6. **Launch Instance**
   - Review and launch
   - Download the key pair (.pem file)
   - Save it securely (e.g., `~/.ssh/oc-pipeline-key.pem`)

### Step 2: Configure Security Group

**Inbound Rules:**
```
Type        Protocol    Port Range    Source          Description
SSH         TCP         22            Your IP         SSH access
HTTP        TCP         80            0.0.0.0/0       HTTP web traffic
HTTPS       TCP         443           0.0.0.0/0       HTTPS web traffic
Custom TCP  TCP         3000          Your IP         Dev server (optional)
```

**Outbound Rules:**
```
All traffic    All    All    0.0.0.0/0    Allow all outbound
```

### Step 3: Connect to EC2 Instance

1. **Set Key Permissions**
   ```bash
   chmod 400 ~/.ssh/oc-pipeline-key.pem
   ```

2. **Get Public IP**
   - From EC2 Console, copy the Public IPv4 address
   - Example: `54.123.456.78`

3. **Connect via SSH**
   ```bash
   ssh -i ~/.ssh/oc-pipeline-key.pem ubuntu@54.123.456.78
   ```

4. **Verify Connection**
   ```bash
   # You should see Ubuntu welcome message
   ubuntu@ip-xxx-xxx-xxx-xxx:~$
   ```

---

## Server Configuration

### Step 1: Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### Step 2: Install Node.js (v20.x)

```bash
# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test: Visit http://YOUR_EC2_IP in browser
# You should see the Nginx welcome page
```

### Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Configure PM2 to start on boot
pm2 startup
# Follow the command it outputs (starts with 'sudo env PATH=...')
```

### Step 5: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

# Clone repository
cd /var/www
git clone https://github.com/ALPA-Const/oc-pipeline.git
cd oc-pipeline
```

### Step 2: Setup Environment Variables

```bash
# Navigate to frontend
cd /var/www/oc-pipeline/frontend

# Create production environment file
cat > .env.production << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration (optional)
VITE_API_URL=https://your-api-url.com

# Environment
NODE_ENV=production
EOF

# Secure the file
chmod 600 .env.production
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

### Step 3: Install Dependencies and Build

```bash
# Navigate to frontend directory
cd /var/www/oc-pipeline/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -lh dist/
```

### Step 4: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/oc-pipeline
```

Add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name your-domain.com www.your-domain.com;
    # Or use IP if no domain: server_name 54.123.456.78;
    
    root /var/www/oc-pipeline/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }

    # Error pages
    error_page 404 /index.html;
}
```

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/oc-pipeline /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: Test Deployment

1. **Visit your site:**
   ```
   http://YOUR_EC2_IP
   or
   http://your-domain.com
   ```

2. **Verify:**
   - Login page loads
   - Static assets load correctly
   - No console errors
   - Authentication works

---

## SSL Certificate Setup

### Using Let's Encrypt (Free SSL)

**Prerequisites:**
- Domain name pointing to your EC2 IP
- Port 80 and 443 open in security group

### Step 1: Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain Certificate

```bash
# Run Certbot
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose to redirect HTTP to HTTPS (recommended)
```

### Step 3: Test Auto-Renewal

```bash
# Dry run renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via systemd timer
sudo systemctl status certbot.timer
```

### Step 4: Verify HTTPS

Visit `https://your-domain.com` and verify:
- ✅ Padlock icon in browser
- ✅ Valid certificate
- ✅ No mixed content warnings

---

## Monitoring & Maintenance

### Application Health Check

Create a health check script:

```bash
cat > /var/www/oc-pipeline/health-check.sh << 'EOF'
#!/bin/bash

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  Disk usage is ${DISK_USAGE}%"
else
    echo "✅ Disk usage is ${DISK_USAGE}%"
fi

# Check memory
FREE_MEM=$(free -m | awk 'NR==2 {print $4}')
echo "ℹ️  Free memory: ${FREE_MEM}MB"

# Test HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ Application responding (HTTP $HTTP_CODE)"
else
    echo "❌ Application error (HTTP $HTTP_CODE)"
fi
EOF

chmod +x /var/www/oc-pipeline/health-check.sh
```

**Run health check:**
```bash
/var/www/oc-pipeline/health-check.sh
```

### Automated Backups

Create backup script:

```bash
cat > /var/www/oc-pipeline/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/oc-pipeline"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /var/www/oc-pipeline

# Backup Nginx config
tar -czf $BACKUP_DIR/nginx-$DATE.tar.gz /etc/nginx/sites-available/oc-pipeline

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm

echo "✅ Backup completed: $BACKUP_DIR/app-$DATE.tar.gz"
EOF

chmod +x /var/www/oc-pipeline/backup.sh
```

**Schedule daily backups:**
```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /var/www/oc-pipeline/backup.sh
```

### Log Monitoring

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -f
```

### Updates

```bash
# Update application
cd /var/www/oc-pipeline
git pull origin main
cd frontend
npm install
npm run build
sudo systemctl reload nginx

# Update system
sudo apt update
sudo apt upgrade -y
sudo reboot  # If kernel updated
```

---

## Troubleshooting

### Issue: Cannot connect to EC2

**Solutions:**
1. Check security group allows your IP on port 22
2. Verify key pair permissions: `chmod 400 your-key.pem`
3. Check instance is running in EC2 console
4. Verify using correct username (ubuntu for Ubuntu AMI)

### Issue: Site not loading

**Solutions:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -50 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Build failed

**Solutions:**
```bash
# Check Node.js version
node --version  # Should be v20.x

# Clear cache and rebuild
cd /var/www/oc-pipeline/frontend
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Out of disk space

**Solutions:**
```bash
# Check disk usage
df -h

# Clean npm cache
npm cache clean --force

# Remove old logs
sudo journalctl --vacuum-time=7d

# Clean old backups
sudo rm /var/backups/oc-pipeline/*
```

### Issue: Application slow

**Solutions:**
```bash
# Check memory usage
free -m

# Check CPU usage
top

# Consider upgrading instance type
# EC2 Console → Actions → Instance Settings → Change Instance Type
```

---

## Cost Estimation

### Monthly AWS Costs (US East)

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| EC2 Instance | t3.medium | ~$30 |
| EBS Storage | 30 GB gp3 | ~$2.40 |
| Data Transfer | 100 GB | ~$9 |
| **Total** | | **~$41.40/month** |

**Cost optimization tips:**
- Use t3 instances (burstable performance)
- Enable detailed monitoring only when debugging
- Use Reserved Instances for long-term (save up to 72%)
- Use Elastic IP only if needed (free when attached to running instance)

---

## Security Best Practices

### 1. SSH Security
```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 2. Automatic Security Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Firewall Rules
```bash
# Restrict SSH to your IP
sudo ufw delete allow OpenSSH
sudo ufw allow from YOUR_IP to any port 22
```

### 4. Fail2Ban (Brute Force Protection)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

## Support

For issues specific to:
- **AWS EC2:** AWS Support or Community Forums
- **Application:** GitHub Issues at https://github.com/ALPA-Const/oc-pipeline/issues
- **Deployment:** Check AUTOGPT_DEPLOYMENT.md

---

**Last Updated:** February 1, 2026  
**Version:** 1.0  
**Status:** Production Ready
