# Environment Setup Guide

This guide explains how to configure environment variables for the OC Pipeline backend.

## Required Environment Variables

The backend requires the following environment variables to run:

### Supabase Configuration

**SUPABASE_URL**
- Your Supabase project URL
- Format: `https://YOUR-PROJECT-REF.supabase.co`
- Where to find: Supabase Dashboard → Settings → API → Project URL

**SUPABASE_SERVICE_ROLE_KEY**
- Your Supabase service role key (secret key)
- ⚠️ **NEVER expose this in client-side code**
- Where to find: Supabase Dashboard → Settings → API → Service role key (under "Project API keys")

### Database Configuration

**DATABASE_URL**
- PostgreSQL connection string
- Can use Supabase connection pooler URL or direct connection
- Format: `postgresql://user:password@host:port/database`

### Optional Configuration

**PORT** (default: 4000)
- Port for the backend server to listen on

**NODE_ENV** (default: development)
- Environment mode: `development` or `production`

**FRONTEND_URL**
- Frontend application URL for CORS and redirects
- Default: `http://localhost:5173`

**ALLOWED_ORIGINS**
- Comma-separated list of allowed CORS origins
- Example: `http://localhost:5173,http://localhost:3000`

## Setup Steps

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard/project/YOUR-PROJECT-REF/settings/api
   - Copy the **Project URL** → set as `SUPABASE_URL`
   - Copy the **Service role key** → set as `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ The service role key bypasses Row Level Security - keep it secret!

3. **Get your database connection string:**
   - Go to: https://supabase.com/dashboard/project/YOUR-PROJECT-REF/settings/database
   - Copy the connection string → set as `DATABASE_URL`
   - Or use the connection pooler URL for better performance

4. **Edit `backend/.env`:**
   ```env
   SUPABASE_URL=https://your-actual-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   DATABASE_URL=postgresql://postgres:password@host:port/database
   ```

5. **Verify the setup:**
   ```bash
   npm run build
   npm run dev
   ```

## Troubleshooting

### Error: "Supabase configuration missing"

**Problem:** Environment variables are not loaded or missing.

**Solution:**
1. Ensure `backend/.env` exists (not just `.env.example`)
2. Check that variables are set without quotes: `SUPABASE_URL=https://...` (not `SUPABASE_URL="https://..."`)
3. Restart the dev server after creating/editing `.env`
4. Verify dotenv is loading: Check that `backend/src/index.ts` has `dotenv.config()` at the top

### Error: "supabaseUrl is required"

**Problem:** `SUPABASE_URL` is undefined when Supabase client is created.

**Solution:**
1. Check `.env` file is in the `backend/` directory (not root)
2. Verify variable name matches exactly: `SUPABASE_URL` (case-sensitive)
3. Ensure no extra spaces: `SUPABASE_URL=https://...` not `SUPABASE_URL = https://...`
4. Restart the dev server

### Environment variables not loading

**Problem:** Variables are set but not accessible in code.

**Solution:**
1. Ensure `dotenv.config()` is called BEFORE any imports that use `process.env`
2. Check `backend/src/index.ts` loads dotenv at the very top
3. Try explicit path: `dotenv.config({ path: resolve(__dirname, '../.env') })`

## Security Notes

- ⚠️ **NEVER commit `.env` files** - They contain secrets
- ✅ `.env` is already in `.gitignore`
- ✅ Use `.env.example` for documentation (with placeholders only)
- ⚠️ **Service role key** has admin access - use only on backend
- ✅ Use **anon key** for client-side Supabase operations

## Production Deployment

For production (Render, Railway, etc.):
1. Set environment variables in your hosting platform's dashboard
2. Do NOT commit `.env` files
3. Use platform-specific secret management if available
4. Verify variables are set before deployment

---

**Need help?** Check the error message - it should point you to this file if configuration is missing.

