# Google OAuth Setup Guide for OC Pipeline

## Part 1: Create Google OAuth Application

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or select existing)
1. Click the project dropdown at the top
2. Click "NEW PROJECT"
3. **Project Name**: "OC Pipeline"
4. Click "CREATE"
5. Wait for the project to be created and select it

### Step 3: Enable Google+ API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "ENABLE"

### Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select **"External"** (unless you have Google Workspace)
3. Click "CREATE"

**Fill in the required information:**
- **App name**: OC Pipeline
- **User support email**: bill@oneillcontractors.com (or your email)
- **App logo**: (optional, upload your logo)
- **Application home page**: https://ocpipeline.vercel.app
- **Application privacy policy link**: https://ocpipeline.vercel.app/privacy (create this page later)
- **Application terms of service link**: https://ocpipeline.vercel.app/terms (create this page later)
- **Authorized domains**: 
  - vercel.app
  - supabase.co
- **Developer contact information**: bill@oneillcontractors.com

4. Click "SAVE AND CONTINUE"
5. **Scopes**: Click "ADD OR REMOVE SCOPES"
   - Select: `userinfo.email`
   - Select: `userinfo.profile`
   - Click "UPDATE"
6. Click "SAVE AND CONTINUE"
7. **Test users**: Add your email for testing
8. Click "SAVE AND CONTINUE"
9. Review and click "BACK TO DASHBOARD"

### Step 5: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. **Application type**: Web application
4. **Name**: OC Pipeline Web Client

**Authorized JavaScript origins:**
```
https://ocpipeline.vercel.app
http://localhost:5173
https://cwrjhtpycynjzeiggyhf.supabase.co
```

**Authorized redirect URIs:**
```
https://cwrjhtpycynjzeiggyhf.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
https://ocpipeline.vercel.app/auth/callback
```

5. Click "CREATE"
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

---

## Part 2: Configure Supabase

### Step 1: Add Google OAuth Provider
1. Go to: https://supabase.com/dashboard/project/cwrjhtpycynjzeiggyhf/auth/providers
2. Find "Google" in the list of providers
3. Click to expand it
4. Toggle "Enable Sign in with Google" to **ON**

### Step 2: Enter Google Credentials
- **Client ID**: Paste the Client ID from Google Cloud Console
- **Client Secret**: Paste the Client Secret from Google Cloud Console
- **Authorized Client IDs**: (leave empty unless using mobile apps)

### Step 3: Save Configuration
- Click "Save"
- Verify the status shows as "Enabled"

### Step 4: Verify Redirect URLs
1. Go to: https://supabase.com/dashboard/project/cwrjhtpycynjzeiggyhf/auth/url-configuration
2. Ensure these are in the Redirect URLs:
   - `https://ocpipeline.vercel.app/**`
   - `http://localhost:5173/**`

---

## Part 3: Testing

### Local Testing (http://localhost:5173)
1. Start the dev server: `npm run dev`
2. Open: http://localhost:5173/login
3. Click "Sign in with Google"
4. You should be redirected to Google's login page
5. Sign in with your Google account
6. You should be redirected back to the app and logged in

### Production Testing (https://ocpipeline.vercel.app)
1. Open: https://ocpipeline.vercel.app/login
2. Click "Sign in with Google"
3. Sign in with your Google account
4. Verify you're redirected back and logged in

### Troubleshooting
- If you get "redirect_uri_mismatch" error:
  - Check that the redirect URI in Google Cloud Console matches exactly
  - Make sure you added the Supabase callback URL
- If you get CORS errors:
  - Verify authorized origins in Google Cloud Console
  - Check Supabase URL configuration
- If login succeeds but user data is missing:
  - Check Supabase Auth logs
  - Verify scopes in Google OAuth consent screen

---

## Part 4: Deploy to Production

### Step 1: Push to GitHub
```bash
git add -A
git commit -m "Add Google OAuth authentication"
git push origin main
```

### Step 2: Verify Vercel Deployment
- Vercel will auto-deploy (1-2 minutes)
- Check deployment status: https://vercel.com/billasmar/oc-pipeline

### Step 3: Test Production
- Open: https://ocpipeline.vercel.app/login
- Click "Sign in with Google"
- Verify the complete flow works

---

## Security Notes

1. **Never commit Client Secret to Git** - It's only stored in Supabase
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Verify email domains** - Consider restricting to @oneillcontractors.com if needed
4. **Monitor auth logs** - Check Supabase Auth logs regularly
5. **Keep credentials secure** - Store in password manager

---

## Next Steps

1. ✅ Create Google OAuth app
2. ✅ Configure Supabase
3. ✅ Update frontend code (done automatically)
4. ✅ Test locally
5. ✅ Deploy to production
6. ✅ Test production
7. 🔄 Create privacy policy page (optional but recommended)
8. 🔄 Create terms of service page (optional but recommended)
9. 🔄 Add email domain restrictions (if needed)
10. 🔄 Set up production OAuth consent (move from testing to production)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase Auth logs
3. Verify all URLs match exactly
4. Ensure Google OAuth app is not in testing mode (for production)
5. Contact support if needed
