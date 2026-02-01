# 🐳 Docker Deployment Guide for OC-Pipeline

## Deploy OC-Pipeline using Docker and Docker Compose

This guide covers deploying OC-Pipeline using Docker containers on AWS EC2 or any server.

---

## 📋 Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- AWS EC2 instance (or any Linux server)
- Domain name (optional)
- Supabase credentials

---

## 🚀 Quick Start

### 1. Install Docker on EC2

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

### 2. Clone Repository

```bash
# SSH back in
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Clone repository
git clone https://github.com/ALPA-Const/oc-pipeline.git
cd oc-pipeline
```

### 3. Configure Environment

```bash
# Copy environment example
cp .env.docker.example .env

# Edit environment variables
nano .env

# Set your actual values:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - DATABASE_URL
# - JWT_SECRET (generate with: openssl rand -base64 32)
```

### 4. Build and Start

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access Application

Open your browser: `http://YOUR_EC2_IP`

---

## 📦 Docker Commands Reference

### Starting and Stopping

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Managing Services

```bash
# Restart specific service
docker-compose restart backend

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec backend node -v
```

### Health Checks

```bash
# Check container status
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost:80

# Inspect container
docker inspect oc-pipeline-backend
```

---

## 🔄 Updating Application

### Update Code

```bash
# Pull latest code
cd /path/to/oc-pipeline
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or in one command
docker-compose up -d --build
```

### Update Single Service

```bash
# Update backend only
docker-compose build backend
docker-compose up -d backend

# Update frontend only
docker-compose build frontend
docker-compose up -d frontend
```

---

## 🔧 Configuration

### Production Nginx Reverse Proxy

For production with SSL, add nginx service to docker-compose.yml:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: oc-pipeline-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - oc-pipeline-network
```

### SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

---

## 📊 Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats oc-pipeline-backend
```

### Resource Usage

```bash
# Disk usage
docker system df

# Container processes
docker-compose top
```

### Health Status

```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health
docker inspect --format='{{json .State.Health}}' oc-pipeline-backend | jq
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
sudo lsof -i :3000
sudo lsof -i :80

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check environment variables
docker-compose exec backend env | grep SUPABASE

# Test connection
docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"

# Restart backend
docker-compose restart backend
```

### Build Failures

```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker image prune -a

# Check build logs
docker-compose build --progress=plain
```

### Memory Issues

```bash
# Check available memory
free -h

# Add memory limits to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 🔒 Security Best Practices

### 1. Use Secrets

Create `.env` file with sensitive data:

```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use environment-specific files
.env.development
.env.staging
.env.production
```

### 2. Network Isolation

```yaml
networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
    internal: true  # No external access
```

### 3. Read-Only Filesystem

```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

### 4. Security Scanning

```bash
# Scan images for vulnerabilities
docker scan oc-pipeline-backend:latest

# Use Docker Bench Security
docker run --rm -it --net host --pid host \
  --userns host --cap-add audit_control \
  -v /var/lib:/var/lib \
  -v /var/run/docker.sock:/var/run/docker.sock \
  docker/docker-bench-security
```

---

## 📦 Backup and Recovery

### Backup Script

```bash
#!/bin/bash
# backup-docker.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

mkdir -p $BACKUP_DIR

# Stop containers
docker-compose stop

# Backup application data
tar -czf $BACKUP_DIR/oc-pipeline-$DATE.tar.gz \
  /var/lib/docker/volumes/ \
  /home/ubuntu/oc-pipeline/

# Start containers
docker-compose start

echo "Backup completed: oc-pipeline-$DATE.tar.gz"
```

### Restore

```bash
# Stop and remove containers
docker-compose down

# Extract backup
tar -xzf oc-pipeline-YYYYMMDD.tar.gz

# Start containers
docker-compose up -d
```

---

## 🚀 Advanced: Multi-Stage Production

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: oc-pipeline-backend:${VERSION:-latest}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  frontend:
    image: oc-pipeline-frontend:${VERSION:-latest}
    deploy:
      replicas: 2
```

### Deploy with Production Config

```bash
# Build with version tag
VERSION=v1.0.0 docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
VERSION=v1.0.0 docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📝 Automation Scripts

### Auto-Update Script

```bash
#!/bin/bash
# auto-update.sh

cd /home/ubuntu/oc-pipeline

# Pull latest code
git pull origin main

# Backup current containers
docker-compose stop
docker commit oc-pipeline-backend oc-pipeline-backend:backup
docker commit oc-pipeline-frontend oc-pipeline-frontend:backup

# Build and deploy
docker-compose build
docker-compose up -d

# Check health
sleep 10
if curl -f http://localhost:3000/health; then
    echo "Update successful"
    # Remove backup
    docker rmi oc-pipeline-backend:backup
    docker rmi oc-pipeline-frontend:backup
else
    echo "Update failed, rolling back"
    docker-compose down
    docker tag oc-pipeline-backend:backup oc-pipeline-backend:latest
    docker tag oc-pipeline-frontend:backup oc-pipeline-frontend:latest
    docker-compose up -d
fi
```

---

## 💰 Cost Optimization

### Image Size Optimization

```dockerfile
# Use alpine images
FROM node:20-alpine

# Multi-stage builds
FROM node:20 AS builder
# ... build steps ...
FROM node:20-alpine
COPY --from=builder /app/dist ./dist

# Clean up
RUN npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/*
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## ✅ Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env` file configured with actual values
- [ ] Firewall configured (ports 80, 443)
- [ ] Containers built successfully
- [ ] Services started and healthy
- [ ] Backend health check passing
- [ ] Frontend accessible
- [ ] Database connection verified
- [ ] Logs checked for errors
- [ ] SSL configured (if using domain)
- [ ] Backup script created
- [ ] Monitoring setup

---

## 🆘 Support

**Common Issues**:

1. **Port already in use**: Check with `sudo lsof -i :PORT` and stop conflicting services
2. **Build fails**: Try `docker-compose build --no-cache`
3. **Container crashes**: Check logs with `docker-compose logs SERVICE_NAME`
4. **Network issues**: Verify `.env` values and restart containers

**Getting Help**:
- Check logs: `docker-compose logs`
- Inspect container: `docker inspect CONTAINER_NAME`
- Debug inside container: `docker-compose exec SERVICE_NAME sh`

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)

---

**Last Updated**: February 2026  
**Version**: 1.0.0
