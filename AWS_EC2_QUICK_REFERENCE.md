# AWS EC2 Deployment - Quick Reference Guide

## 🚀 Quick Start (5 Steps)

### 1. Launch EC2 Instance
```bash
# Instance: Ubuntu 22.04 LTS, t3.medium
# Security Group: Ports 22, 80, 443 open
# Download key pair: oc-pipeline-key.pem
```

### 2. Connect to Instance
```bash
chmod 400 oc-pipeline-key.pem
ssh -i oc-pipeline-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Run Setup Script
```bash
# Copy and run this one-liner:
curl -fsSL https://raw.githubusercontent.com/ALPA-Const/oc-pipeline/main/scripts/ec2-setup.sh | bash
```

### 4. Deploy Application
```bash
# Clone and deploy:
cd /var/www
git clone https://github.com/ALPA-Const/oc-pipeline.git
cd oc-pipeline
./scripts/ec2-deploy.sh
```

### 5. Access Application
```
http://YOUR_EC2_IP
```

---

## 📋 Common Commands

### Server Management
```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Application Updates
```bash
cd /var/www/oc-pipeline
git pull origin main
cd frontend
npm install
npm run build
sudo systemctl reload nginx
```

### SSL Certificate
```bash
# One-time setup
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Health Check
```bash
# Test application
curl -I http://localhost

# Check disk space
df -h

# Check memory
free -m

# Check processes
pm2 list
```

---

## 🔧 Environment Variables

Edit: `/var/www/oc-pipeline/frontend/.env.production`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Site Not Loading
```bash
sudo nginx -t                    # Test config
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart
```

### Build Errors
```bash
cd /var/www/oc-pipeline/frontend
rm -rf node_modules dist
npm install
npm run build
```

### SSL Issues
```bash
sudo certbot certificates        # Check certificates
sudo certbot renew --force-renewal  # Force renewal
```

---

## 📊 Monitoring

### View Logs
```bash
# Application logs
cd /var/www/oc-pipeline/frontend
npm run preview   # Test locally

# Nginx access logs
sudo tail -100 /var/log/nginx/access.log

# Nginx error logs
sudo tail -100 /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -n 50
```

### Performance
```bash
# Check resources
htop              # CPU/Memory usage
df -h            # Disk space
netstat -tuln    # Network connections
```

---

## 💰 Cost Management

### Stop Instance (saves compute costs)
```bash
# From AWS Console:
# EC2 → Select Instance → Instance State → Stop
```

### Terminate Instance (stops all charges)
```bash
# WARNING: This deletes everything
# EC2 → Select Instance → Instance State → Terminate
```

### Monitor Costs
- AWS Console → Billing Dashboard
- Set up billing alerts
- Use AWS Cost Explorer

---

## 🔐 Security Checklist

- [ ] SSH key secured (chmod 400)
- [ ] Security group restricts SSH to your IP
- [ ] Firewall enabled (ufw)
- [ ] SSL certificate installed
- [ ] Automatic security updates enabled
- [ ] Regular backups configured
- [ ] Strong Supabase credentials
- [ ] Environment variables secured

---

## 📱 Access Points

After deployment, access these URLs:

- **Main Application:** `http://YOUR_EC2_IP` or `https://your-domain.com`
- **Login Page:** `/login`
- **Dashboard:** `/dashboard`
- **AutoGPT:** `/autogpt` (requires authentication)

---

## 🆘 Support Resources

- **Full Guide:** AWS_EC2_DEPLOYMENT.md
- **Scripts:** `/scripts/` directory
- **GitHub Issues:** https://github.com/ALPA-Const/oc-pipeline/issues
- **AWS Support:** https://console.aws.amazon.com/support/

---

## 🎯 Production Checklist

Before going live:

- [ ] EC2 instance launched and running
- [ ] Server setup completed (ec2-setup.sh)
- [ ] Application deployed (ec2-deploy.sh)
- [ ] Environment variables configured
- [ ] Domain DNS configured (if using domain)
- [ ] SSL certificate installed
- [ ] Application tested in browser
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Security best practices applied

---

**Quick Help:**
- Setup issue? Check AWS_EC2_DEPLOYMENT.md Section 8
- Build error? Run `npm run build` in frontend directory
- Nginx error? Run `sudo nginx -t` to test config
- SSL error? Run `sudo certbot certificates` to check status

**Need more help?** See the full AWS_EC2_DEPLOYMENT.md guide for detailed instructions.
