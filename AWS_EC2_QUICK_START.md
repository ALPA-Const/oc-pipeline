# 🚀 Quick AWS EC2 Deployment Reference

## One-Page Quick Start Guide

### 📋 Prerequisites Checklist
- [ ] AWS Account
- [ ] EC2 Key Pair (.pem file)
- [ ] Supabase URL and Keys
- [ ] SSH Client installed

---

## 🎯 5-Minute Deployment

### Step 1: Launch EC2 (2 minutes)
1. Go to: https://console.aws.amazon.com/ec2
2. Click "Launch Instance"
3. **Settings**:
   - Name: `oc-pipeline`
   - AMI: Ubuntu 22.04 LTS
   - Type: t3.small (or t2.micro for testing)
   - Key pair: Your key or create new
   - Security: Allow SSH (22), HTTP (80), HTTPS (443)
   - Storage: 20 GB
4. Click "Launch"

### Step 2: Connect (1 minute)
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 3: Auto-Setup (2 minutes)
```bash
# Download and run setup script
curl -o setup.sh https://raw.githubusercontent.com/ALPA-Const/oc-pipeline/main/scripts/setup-ec2.sh
chmod +x setup.sh
./setup.sh
```

**Follow prompts to enter**:
- Supabase URL
- Supabase Keys
- Database URL
- Frontend URL (your EC2 IP)

### Step 4: Access
Open browser: `http://YOUR_EC2_IP`

---

## 🔧 Essential Commands

### Check Status
```bash
pm2 status                    # Backend status
sudo systemctl status nginx   # Nginx status
curl http://localhost:3000/health  # Backend health
```

### View Logs
```bash
pm2 logs oc-pipeline-backend --lines 50
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart oc-pipeline-backend
sudo systemctl restart nginx
```

### Update Application
```bash
cd /var/www/oc-pipeline
./deploy.sh
```

---

## 🔒 SSL Setup (Optional)

If you have a domain:

```bash
sudo certbot --nginx -d yourdomain.com
```

That's it! Automatic HTTPS.

---

## 🐳 Docker Alternative

If you prefer Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and setup
git clone https://github.com/ALPA-Const/oc-pipeline.git
cd oc-pipeline
cp .env.docker.example .env
nano .env  # Edit values

# Start
docker-compose up -d

# Check
docker-compose ps
```

---

## 💰 Cost Estimate

| Instance | Monthly Cost |
|----------|-------------|
| t2.micro (free tier) | $0-8 |
| t3.small | $15-20 |
| t3.medium | $30-35 |

Plus ~$2-5 for storage and data transfer.

---

## 🆘 Quick Troubleshooting

**Backend won't start**:
```bash
pm2 logs oc-pipeline-backend --err
pm2 restart oc-pipeline-backend
```

**Frontend not loading**:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Can't connect**:
- Check Security Group allows ports 80, 443, 22
- Verify EC2 instance is running
- Check firewall: `sudo ufw status`

---

## 📚 Full Documentation

- **Complete Guide**: `AWS_EC2_DEPLOYMENT.md`
- **Docker Guide**: `DOCKER_DEPLOYMENT.md`
- **Nginx Config**: `nginx.conf.template`

---

## ✅ Success Indicators

- ✓ PM2 shows backend running
- ✓ `curl http://localhost:3000/health` returns 200
- ✓ Browser loads application
- ✓ Can login/signup
- ✓ No errors in logs

---

**Need Help?** Check full documentation or logs!
