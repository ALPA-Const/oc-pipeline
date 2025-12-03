# OC Pipeline - Production Deployment Guide

## Prerequisites

- ✅ Backend deployed on Render: https://oc-pipeline.onrender.com
- ✅ Supabase project configured
- ✅ GitHub repository: https://github.com/AlpaServices/oc-pipeline
- 🔲 Vercel account (free tier works)

---

## Step 1: Verify Backend Deployment

### Check Render Status
1. Go to https://dashboard.render.com
2. Find your `oc-pipeline` service
3. Verify it shows **"Live"** status
4. Copy your backend URL (e.g., `https://oc-pipeline.onrender.com`)

### Test Backend Health Endpoint
```bash
curl https://oc-pipeline.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T..."
}
```

---

## Step 2: Deploy Frontend to Vercel

### A. Connect GitHub to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository**:
   - Search for `AlpaServices/oc-pipeline`
   - Click "Import"

### B. Configure Build Settings

**Framework Preset**: Vite

**Root Directory**: `frontend`

**Build Command**:
```bash
npm install && npm run build
```

**Output Directory**: `dist`

**Install Command**: 
```bash
npm install
```

### C. Add Environment Variables

Click **"Environment Variables"** and add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://cwrjhtpycynjzeiggyhf.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmpodHB5Y3luanplaWdneWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDIzMDAsImV4cCI6MjA3NzAxODMwMH0.bl7-6rdapIcq9Dr7cDIuOqV2FbCTIvBYlP5znQbJNjk` | Production |
| `VITE_API_URL` | `https://oc-pipeline.onrender.com` | Production |

**Important**: Replace `https://oc-pipeline.onrender.com` with your actual Render backend URL!

### D. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Vercel will provide your deployment URL (e.g., `https://oc-pipeline.vercel.app`)

---

## Step 3: Update Backend CORS Settings

After getting your Vercel URL, update the backend to allow requests from it:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your `oc-pipeline` service**
3. **Go to "Environment" tab**
4. **Update `ALLOWED_ORIGINS`**:
   ```
   https://your-vercel-url.vercel.app,http://localhost:5173
   ```
5. **Save Changes** (this will trigger a redeploy)

---

## Step 4: Test the Deployment

### A. Test Frontend Access
1. Open your Vercel URL: `https://your-vercel-url.vercel.app`
2. Verify the login page loads correctly
3. Check browser console for any errors

### B. Test Authentication Flow

**Signup Test**:
1. Click "Sign Up"
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
3. Submit the form
4. Verify you receive a success message
5. Check email for Supabase confirmation

**Login Test**:
1. Go to login page
2. Enter the same credentials
3. Submit the form
4. Verify you're redirected to the dashboard
5. Check that user data is displayed correctly

### C. Test Backend Connection

Open browser DevTools (F12) → Network tab:
1. Perform login
2. Check for API calls to your Render backend
3. Verify responses are successful (status 200)

---

## Step 5: Verify Database Integration

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `cwrjhtpycynjzeiggyhf`
3. **Go to "Authentication" → "Users"**
4. **Verify** your test user appears in the list
5. **Check "Table Editor"** to see if user data is stored correctly

---

## Troubleshooting

### Issue: "Network Error" on Login/Signup

**Solution**: Check CORS settings
```bash
# Test backend CORS
curl -H "Origin: https://your-vercel-url.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://oc-pipeline.onrender.com/api/auth/login
```

### Issue: "Invalid API Key" Error

**Solution**: Verify environment variables in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check `VITE_SUPABASE_ANON_KEY` is correct
3. Redeploy if you made changes

### Issue: Backend Not Responding

**Solution**: Check Render logs
1. Go to Render Dashboard → Your Service → Logs
2. Look for errors or crashes
3. Verify environment variables are set correctly

### Issue: Build Fails on Vercel

**Solution**: Check build logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Check the build logs for errors
4. Common fixes:
   - Ensure `package.json` has all dependencies
   - Verify build command is correct
   - Check for TypeScript errors

---

## Production Checklist

- [ ] Backend deployed on Render and showing "Live" status
- [ ] Backend health endpoint responding correctly
- [ ] Frontend deployed on Vercel successfully
- [ ] All environment variables configured correctly
- [ ] CORS settings updated with Vercel URL
- [ ] Signup flow tested and working
- [ ] Login flow tested and working
- [ ] Dashboard loads with user data
- [ ] Database shows user records in Supabase
- [ ] No console errors in browser DevTools
- [ ] API calls to backend succeeding (check Network tab)

---

## URLs Reference

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend (Render)** | `https://oc-pipeline.onrender.com` | API server |
| **Frontend (Vercel)** | `https://your-vercel-url.vercel.app` | Web application |
| **Supabase** | `https://cwrjhtpycynjzeiggyhf.supabase.co` | Database & Auth |
| **GitHub** | `https://github.com/AlpaServices/oc-pipeline` | Source code |

---

## Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Add your custom domain in Vercel settings
   - Update CORS in Render with new domain

2. **Monitoring**:
   - Set up Vercel Analytics
   - Monitor Render logs for errors
   - Check Supabase usage metrics

3. **Security**:
   - Enable Supabase RLS policies
   - Review CORS settings
   - Set up rate limiting

4. **Performance**:
   - Enable Vercel Edge caching
   - Optimize images and assets
   - Monitor Core Web Vitals

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Render logs: https://dashboard.render.com
3. Review Vercel logs: https://vercel.com/dashboard
4. Check Supabase logs: https://app.supabase.com

---

**Deployment completed successfully! 🎉**

Your OC Pipeline application is now live and ready for testing.