# 🚀 AWS EC2 Deployment Guide for OC-Pipeline

## Complete Guide to Deploy OC-Pipeline on Amazon Web Services EC2

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Options](#architecture-options)
4. [Quick Start Deployment](#quick-start-deployment)
5. [Detailed Setup Instructions](#detailed-setup-instructions)
6. [SSL/HTTPS Configuration](#ssl-https-configuration)
7. [Domain Setup](#domain-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Cost Optimization](#cost-optimization)

---

## 🎯 Overview

This guide covers deploying the OC-Pipeline construction management application on AWS EC2. The application consists of:

- **Frontend**: Vite + React + TypeScript (Static files)
- **Backend**: Node.js + Express API server
- **Database**: Supabase (managed PostgreSQL)
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2 (Node.js apps)

---

## ✅ Prerequisites

### AWS Account Requirements
- [ ] AWS Account with EC2 access
- [ ] AWS CLI installed (optional but recommended)
- [ ] SSH key pair for EC2 access
- [ ] Basic understanding of Linux/Ubuntu

### Application Requirements
- [ ] Supabase project URL and keys
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (Let's Encrypt - free)

### Local Requirements
- [ ] SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- [ ] Git installed
- [ ] Node.js 18+ (for building locally if needed)

---

## 🏗️ Architecture Options

### Option 1: Single EC2 Instance (Recommended to Start) ⭐

**Perfect for**: Small to medium traffic, cost-effective starting point

```
┌─────────────────────────────────────┐
│        EC2 Instance (t3.small)      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         Nginx                │  │
│  │  (Port 80/443 - External)   │  │
│  └──────────────────────────────┘  │
│              │                      │
│              ├─► Frontend (Static)  │
│              │   /var/www/html     │
│              │                      │
│              └─► Backend (PM2)      │
│                  Port 3000          │
│                                     │
│  Supabase (External PostgreSQL)    │
└─────────────────────────────────────┘
```

**Recommended Instance**: t3.small (2 vCPU, 2 GB RAM)  
**Estimated Cost**: ~$15-20/month

---

### Option 2: Separate Frontend & Backend

**Perfect for**: Better isolation, independent scaling

```
┌──────────────────┐         ┌──────────────────┐
│  Frontend EC2    │         │  Backend EC2     │
│  (t2.micro)      │         │  (t3.small)      │
│                  │         │                  │
│  Nginx + Static  │────────▶│  Node.js + PM2   │
│  Files           │         │  Port 3000       │
└──────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            Supabase (External)
```

**Estimated Cost**: ~$25-35/month

---

### Option 3: Production with Auto Scaling

**Perfect for**: High traffic, production environments

```
                Load Balancer (ALB)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   EC2 Instance    EC2 Instance    EC2 Instance
   Auto Scaling Group (2-10 instances)
        │
        └──────▶ Backend EC2 (or RDS)
                        │
                        ▼
                  Supabase/RDS
```

**Estimated Cost**: ~$100+/month

---

## 🚀 Quick Start Deployment

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**: https://console.aws.amazon.com/ec2

2. **Launch Instance**:
   - Click "Launch Instance"
   - Name: `oc-pipeline-server`
   - Choose AMI: **Ubuntu Server 22.04 LTS** (recommended)
   - Instance Type: **t3.small** (or t2.micro for free tier)
   - Key pair: Create new or select existing
   - Network settings:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - Storage: 20 GB gp3 SSD
   - Click "Launch Instance"

3. **Note Your Instance Details**:
   - Public IPv4 address
   - Public IPv4 DNS
   - Instance ID

---

### Step 2: Connect to Your EC2 Instance

```bash
# Change permissions on your key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Example:
# ssh -i my-aws-key.pem ubuntu@54.123.45.67
```

---

### Step 3: Run Automated Setup Script

Once connected to your EC2 instance, run this automated setup:

```bash
# Download and run the setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/ALPA-Const/oc-pipeline/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**Or manually follow the detailed steps below** ⬇️

---

## 📝 Detailed Setup Instructions

### Step 4: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx nodejs npm git curl wget certbot python3-certbot-nginx

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
nginx -v        # Should show nginx version
```

---

### Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Verify PM2
pm2 --version
```

---

### Step 6: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/oc-pipeline
sudo chown -R ubuntu:ubuntu /var/www/oc-pipeline

# Clone repository
cd /var/www/oc-pipeline
git clone https://github.com/ALPA-Const/oc-pipeline.git .

# Or if using SSH
# git clone git@github.com:ALPA-Const/oc-pipeline.git .
```

---

### Step 7: Setup Backend

```bash
# Navigate to backend
cd /var/www/oc-pipeline/backend

# Install dependencies
npm install --production

# Create environment file
cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://your-db-url

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ISSUER=oc-pipeline
JWT_AUDIENCE=authenticated

# CORS Configuration
FRONTEND_URL=http://YOUR_EC2_IP
ALLOWED_ORIGINS=http://YOUR_EC2_IP,http://localhost:5173
EOF

# Build the application
npm run build

# Start backend with PM2
pm2 start dist/index.js --name oc-pipeline-backend
pm2 save
```

**🔐 Security Note**: Replace all placeholder values with your actual credentials!

---

### Step 8: Setup Frontend

```bash
# Navigate to frontend
cd /var/www/oc-pipeline/frontend

# Install dependencies
npm install

# Create environment file
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://YOUR_EC2_IP/api
EOF

# Build frontend
npm run build

# Copy built files to Nginx directory
sudo mkdir -p /var/www/html/oc-pipeline
sudo cp -r dist/* /var/www/html/oc-pipeline/
sudo chown -R www-data:www-data /var/www/html/oc-pipeline
```

---

### Step 9: Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/oc-pipeline << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend - Serve static files
    root /var/www/html/oc-pipeline;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Reverse proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/oc-pipeline /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### Step 10: Configure Firewall

```bash
# Setup UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

---

### Step 11: Verify Deployment

```bash
# Check PM2 status
pm2 status
pm2 logs oc-pipeline-backend --lines 50

# Check Nginx status
sudo systemctl status nginx

# Test backend
curl http://localhost:3000/health

# Test from outside (replace with your EC2 IP)
curl http://YOUR_EC2_IP/api/health
```

**🎉 Your application should now be running!**

Access it at: `http://YOUR_EC2_IP`

---

## 🔒 SSL/HTTPS Configuration

### Using Let's Encrypt (Free SSL)

**Prerequisites**: You need a domain name pointing to your EC2 IP

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Certbot will automatically configure Nginx for HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certificate auto-renews every 90 days automatically!**

---

## 🌐 Domain Setup

### Configure DNS Records

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)

2. **Add DNS Records**:

   **A Record**:
   ```
   Type: A
   Name: @
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 3600
   ```

   **A Record (www)**:
   ```
   Type: A
   Name: www
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 3600
   ```

3. **Wait for DNS propagation** (5-30 minutes)

4. **Verify**:
   ```bash
   nslookup yourdomain.com
   dig yourdomain.com
   ```

### Update Environment Variables

After configuring domain:

```bash
# Update backend .env
cd /var/www/oc-pipeline/backend
nano .env
# Change FRONTEND_URL to https://yourdomain.com
# Add domain to ALLOWED_ORIGINS

# Restart backend
pm2 restart oc-pipeline-backend

# Update Nginx config
sudo nano /etc/nginx/sites-available/oc-pipeline
# Change server_name to yourdomain.com www.yourdomain.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Maintenance

### Monitor Application

```bash
# View PM2 logs
pm2 logs oc-pipeline-backend
pm2 logs oc-pipeline-backend --lines 100

# Monitor in real-time
pm2 monit

# Check resource usage
pm2 show oc-pipeline-backend
```

### Monitor Server Resources

```bash
# CPU and memory
htop
# or
top

# Disk usage
df -h

# Network connections
netstat -tulpn

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Setup Automated Monitoring (Optional)

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔄 Deployment Updates

### Update Application Code

```bash
# Create update script
cat > /var/www/oc-pipeline/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
cd /var/www/oc-pipeline
git pull origin main

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

# Run deployment
./deploy.sh
```

---

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs oc-pipeline-backend --err

# Check if port is in use
sudo lsof -i :3000

# Restart backend
pm2 restart oc-pipeline-backend
pm2 flush  # Clear logs if needed
```

### Frontend Not Loading

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/html/oc-pipeline/

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Test Supabase connection
curl -X GET 'https://your-project.supabase.co/rest/v1/' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Check backend environment
cd /var/www/oc-pipeline/backend
cat .env | grep SUPABASE
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### High CPU/Memory Usage

```bash
# Check processes
htop

# PM2 memory usage
pm2 show oc-pipeline-backend

# Restart if needed
pm2 restart oc-pipeline-backend

# Consider upgrading instance type if consistently high
```

---

## 💰 Cost Optimization

### Instance Sizing

| Instance Type | vCPU | RAM | Storage | Monthly Cost* | Best For |
|---------------|------|-----|---------|---------------|----------|
| t2.micro | 1 | 1 GB | 8 GB | $8-10 | Testing only |
| t3.small | 2 | 2 GB | 20 GB | $15-20 | Small apps |
| t3.medium | 2 | 4 GB | 30 GB | $30-35 | Production |
| t3.large | 2 | 8 GB | 50 GB | $60-70 | High traffic |

*Approximate costs, varies by region

### Cost Reduction Tips

1. **Use Reserved Instances**: Save up to 75% for 1-3 year commitments
2. **Setup Auto-Shutdown**: Stop instance during off-hours if applicable
3. **Use Elastic IP**: Only if you need persistent IP (charged when not attached)
4. **Monitor Data Transfer**: Minimize unnecessary outbound data
5. **Use S3 for Static Assets**: Offload images/files to S3
6. **Enable CloudWatch Alarms**: Get notified of high usage

### Free Tier Usage

- **EC2 t2.micro**: 750 hours/month free (first 12 months)
- **EBS Storage**: 30 GB/month free
- **Data Transfer**: 100 GB/month outbound free

---

## 🔐 Security Best Practices

### Essential Security Steps

1. **Keep System Updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Change Default SSH Port** (Optional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to Port 2222
   sudo systemctl restart sshd
   ```

3. **Setup Fail2Ban**:
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Regular Backups**:
   ```bash
   # Backup application
   tar -czf oc-pipeline-backup-$(date +%Y%m%d).tar.gz /var/www/oc-pipeline
   
   # Backup to S3 (if configured)
   aws s3 cp oc-pipeline-backup-*.tar.gz s3://your-bucket/backups/
   ```

5. **Monitor Security Logs**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

---

## 📦 Backup & Recovery

### Automated Backup Script

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/oc-pipeline-$DATE.tar.gz /var/www/oc-pipeline

# Keep only last 7 backups
ls -t $BACKUP_DIR/oc-pipeline-*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: oc-pipeline-$DATE.tar.gz"
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
```

### Restore from Backup

```bash
# Stop services
pm2 stop all
sudo systemctl stop nginx

# Extract backup
tar -xzf oc-pipeline-backup-YYYYMMDD.tar.gz -C /

# Restart services
pm2 start all
sudo systemctl start nginx
```

---

## 🎓 Additional Resources

### AWS Documentation
- [EC2 Getting Started](https://docs.aws.amazon.com/ec2/index.html)
- [EC2 Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Elastic IP Addresses](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)

### Application Documentation
- Backend API: `/backend/README.md`
- Frontend: `/frontend/README.md`
- Supabase Setup: `/docs/SUPABASE_SETUP.md`

### Tools Documentation
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)

---

## ✅ Deployment Checklist

Before going live:

- [ ] EC2 instance launched and accessible
- [ ] Domain configured (if using)
- [ ] SSL certificate installed
- [ ] Backend running and healthy
- [ ] Frontend accessible
- [ ] Database connection verified
- [ ] Environment variables set correctly
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] PM2 configured for auto-restart
- [ ] Nginx optimized
- [ ] Security groups reviewed
- [ ] Cost alerts configured

---

## 🆘 Support

**Need Help?**

1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs: `pm2 logs`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify environment variables
5. Ensure all services are running

---

## 🎉 Success!

Your OC-Pipeline application is now running on AWS EC2!

**Access your application**:
- HTTP: `http://YOUR_EC2_IP` or `http://yourdomain.com`
- HTTPS: `https://yourdomain.com` (after SSL setup)
- Backend API: `http://YOUR_EC2_IP/api` or `https://yourdomain.com/api`

---

**Last Updated**: February 2026  
**Version**: 1.0.0
