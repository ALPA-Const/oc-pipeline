# OC Pipeline Backend Deployment Guide

## Prerequisites

Before deploying the OC Pipeline backend, ensure you have:

- **Node.js 20+** installed locally for development
- **Supabase Project** with PostgreSQL 15 database
- **Render Account** (or alternative hosting platform like Railway, Fly.io, or Heroku)
- **Git** for version control

## Environment Variables

The following environment variables must be configured in your deployment environment:

### Server Configuration
- `PORT` - Server port (default: 10000)
- `NODE_ENV` - Environment mode (`production` or `development`)

### Database & Supabase
- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_ANON_KEY` - Public anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY` - **SECRET** Service role key with admin privileges (never expose publicly!)
- `DATABASE_URL` - PostgreSQL connection string with connection pooler (format: `postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true`)

### Authentication
- `JWT_SECRET` - Secret key for additional JWT signing (generate with `openssl rand -base64 32`)
- `JWT_ISSUER` - Supabase auth URL (e.g., `https://xxxxx.supabase.co/auth/v1`)
- `JWT_AUDIENCE` - JWT audience claim (use `authenticated`)

### CORS Configuration
- `FRONTEND_URL` - Your frontend application URL (e.g., `https://oc-pipeline.vercel.app`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://oc-pipeline.vercel.app,https://app.ocpipeline.com`)

### Example .env File

```env
# Server
PORT=10000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true

# JWT
JWT_SECRET=your-random-secret-key-here
JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
JWT_AUDIENCE=authenticated

# CORS
FRONTEND_URL=https://oc-pipeline.vercel.app
ALLOWED_ORIGINS=https://oc-pipeline.vercel.app,http://localhost:3000
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password
3. Select a region close to your users
4. Wait for project provisioning (2-3 minutes)

### 2. Run Database Migrations

Execute the SQL migrations in the following order using the Supabase SQL Editor:

#### Step 1: Foundation & Admin Module
```bash
# File: database/migrations/001_foundation_admin.sql
```
Creates core tables: users, workspaces, roles, permissions, audit logs

#### Step 2: Core Business Modules
```bash
# File: database/migrations/002_core_modules.sql
```
Creates tables for: clients, matters, documents, billing, time tracking

#### Step 3: Support & Agentic Infrastructure
```bash
# File: database/migrations/003_support_agentic.sql
```
Creates tables for: agents, knowledge graph, events, tasks, memory

#### Step 4: Seed Initial Data
```bash
# File: database/migrations/004_seed_data.sql
```
Populates default roles, permissions, and ATLAS agents

### 3. Verify Database Setup

After running all migrations, verify the setup:

```sql
-- Check total table count (should be 126)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check ATLAS agents
SELECT agent_id, name, module, status FROM agents;

-- Check default roles
SELECT role_id, name, description FROM roles;
```

Expected results:
- **126 tables** total
- **12 ATLAS agents** (one per module)
- **4 default roles** (Super Admin, Admin, User, Guest)

## Render Deployment

### Option 1: Manual Deployment

1. **Create New Web Service**
   - Go to [render.com](https://render.com) dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `oc-pipeline-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `20`

3. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
   - **Instance Type**: Choose based on needs (Starter is fine for development)

4. **Environment Variables**
   - Add all variables from the Environment Variables section above
   - Use "Add from .env" if you have a local .env file

5. **Deploy**
   - Click "Create Web Service"
   - Wait for initial deployment (5-10 minutes)
   - Check logs for any errors

### Option 2: Blueprint Deployment

Use the included `render.yaml` file for one-click deployment:

1. Fork/clone the repository
2. Push to your GitHub account
3. In Render dashboard, click "New +" → "Blueprint"
4. Select your repository
5. Render will automatically detect `render.yaml`
6. Fill in environment variables when prompted
7. Click "Apply"

### Post-Deployment Verification

Once deployed, test your endpoints:

```bash
# Health check
curl https://oc-pipeline.onrender.com/health

# Detailed health (should show database connection)
curl https://oc-pipeline.onrender.com/health/detailed
```

## Testing Deployment

### 1. Health Check

```bash
curl https://oc-pipeline.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### 2. Detailed Health Check

```bash
curl https://oc-pipeline.onrender.com/health/detailed
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "status": "connected",
    "responseTime": 45
  },
  "memory": {
    "used": 125829120,
    "total": 536870912,
    "percentage": 23.44
  }
}
```

### 3. User Registration

```bash
curl -X POST https://oc-pipeline.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "full_name": "Test User"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  }
}
```

### 4. User Login

```bash
curl -X POST https://oc-pipeline.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 5. Authenticated Request

```bash
# Get current user profile
curl https://oc-pipeline.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "full_name": "Test User",
      "role": "user",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### 6. Test Protected Endpoint

```bash
# List workspaces (requires authentication)
curl https://oc-pipeline.onrender.com/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Monitoring & Maintenance

### Logs

View application logs in Render dashboard:
- Go to your service
- Click "Logs" tab
- Filter by severity (Info, Warning, Error)

### Database Monitoring

Monitor database performance in Supabase:
- Go to Supabase project dashboard
- Navigate to "Database" → "Query Performance"
- Check connection pooler usage
- Monitor slow queries

### Health Checks

Set up external monitoring (recommended):
- [UptimeRobot](https://uptimerobot.com) - Free tier available
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Configure to check `/health` endpoint every 5 minutes.

### Scaling

As your application grows:

1. **Vertical Scaling** (Render)
   - Upgrade instance type in service settings
   - Options: Starter → Standard → Pro

2. **Database Scaling** (Supabase)
   - Upgrade to Pro plan for more connections
   - Enable read replicas for read-heavy workloads
   - Consider connection pooling optimization

3. **Caching**
   - Add Redis for session storage
   - Implement query result caching
   - Use CDN for static assets

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom**: `Error: connect ETIMEDOUT`

**Solution**:
- Verify `DATABASE_URL` uses connection pooler (port 6543)
- Check Supabase project is not paused
- Verify IP allowlist in Supabase (should allow all for Render)

#### 2. JWT Verification Failures

**Symptom**: `Error: invalid signature`

**Solution**:
- Ensure `JWT_ISSUER` matches your Supabase auth URL exactly
- Verify `JWT_AUDIENCE` is set to `authenticated`
- Check token hasn't expired

#### 3. CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser

**Solution**:
- Add frontend URL to `ALLOWED_ORIGINS`
- Ensure `FRONTEND_URL` is set correctly
- Check for trailing slashes (should not have them)

#### 4. Migration Failures

**Symptom**: Errors when running SQL migrations

**Solution**:
- Run migrations in correct order (001 → 002 → 003 → 004)
- Check for existing tables (drop if re-running)
- Verify Supabase project has sufficient resources

### Getting Help

- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Render Support**: [render.com/docs](https://render.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## Security Checklist

Before going to production:

- [ ] All environment variables set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` kept secret (never in frontend)
- [ ] Strong `JWT_SECRET` generated (32+ characters)
- [ ] `NODE_ENV` set to `production`
- [ ] CORS configured with specific origins (not `*`)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Database backups enabled in Supabase
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Error messages don't expose sensitive data

## Backup & Recovery

### Database Backups

Supabase automatically backs up your database:
- **Free tier**: Daily backups, 7-day retention
- **Pro tier**: Daily backups, 30-day retention + point-in-time recovery

Manual backup:
```bash
# Using pg_dump
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore from Backup

1. Go to Supabase dashboard → Database → Backups
2. Select backup to restore
3. Click "Restore"
4. Confirm restoration (this will overwrite current data)

## Performance Optimization

### Database Indexes

Ensure critical indexes exist:
```sql
-- Check existing indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Connection Pooling

Use Supabase connection pooler for better performance:
- Transaction mode: Port 6543 (recommended for APIs)
- Session mode: Port 5432 (for migrations)

### Query Optimization

Monitor slow queries:
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Next Steps

After successful deployment:

1. **Set up monitoring** - Configure uptime monitoring and alerts
2. **Test all endpoints** - Run comprehensive API tests
3. **Configure CI/CD** - Set up automated testing and deployment
4. **Document API changes** - Keep API documentation up to date
5. **Plan scaling strategy** - Prepare for growth

---

**Need help?** Check the [API Documentation](./API.md) or open an issue on GitHub.