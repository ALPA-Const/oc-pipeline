# Deployment Debugging Guide

## Issue: "Failed to fetch" on Vercel Deployment

### Steps to Debug:

1. **Check Browser Console**
   - Open https://ocpipeline.vercel.app
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for the debug messages starting with "=== SUPABASE DEBUG INFO ==="
   - Check if environment variables are loaded

2. **Expected Console Output (Success):**
   ```
   === SUPABASE DEBUG INFO ===
   Environment: production
   Supabase URL: https://cwrjhtpycynjzeiggyhf.supabase.co
   Supabase Key exists: true
   Supabase Key length: 204
   All env vars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
   ===========================
   ✅ Supabase connected successfully
   ```

3. **If Environment Variables are Missing:**
   - The console will show: "❌ MISSING SUPABASE CREDENTIALS!"
   - This means Vercel environment variables are not set correctly

4. **Verify Vercel Environment Variables:**
   - Go to: https://vercel.com/billasmar/oc-pipeline/settings/environment-variables
   - Ensure both variables are set:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_ANON_KEY
   - Ensure they are enabled for "Production" environment
   - After adding/updating, you MUST redeploy

5. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try to login
   - Look for requests to "cwrjhtpycynjzeiggyhf.supabase.co"
   - Check the request status and response

6. **Common Issues:**
   - Environment variables not set in Vercel
   - Environment variables set but not enabled for Production
   - Typo in variable names (must be exactly VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
   - Need to redeploy after adding environment variables
   - CORS issue in Supabase (need to add Vercel URL to allowed origins)

7. **Supabase CORS Configuration:**
   - Go to: https://supabase.com/dashboard/project/cwrjhtpycynjzeiggyhf/auth/url-configuration
   - Site URL: https://ocpipeline.vercel.app
   - Redirect URLs should include:
     - https://ocpipeline.vercel.app/**
     - http://localhost:5173/**

## Next Steps After This Commit:

1. Push to GitHub: `git push origin main`
2. Vercel will auto-deploy
3. Wait 1-2 minutes for deployment
4. Open https://ocpipeline.vercel.app
5. Open Browser Console (F12)
6. Check the debug output
7. Report back what you see in the console
