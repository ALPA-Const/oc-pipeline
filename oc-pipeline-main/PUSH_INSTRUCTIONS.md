# Push to GitHub Instructions

## Current Status
- ✅ All code changes committed
- ✅ .env.local is properly ignored
- ✅ Google OAuth integration complete
- ⏳ Ready to push to GitHub

## To Push to GitHub

You need to authenticate with GitHub. Choose one of these methods:

### Option 1: Personal Access Token (Recommended)
```bash
cd /workspace/ON_Precon_Software/frontend
git push https://YOUR_GITHUB_TOKEN@github.com/BillAsmar/oc-pipeline.git main
```

### Option 2: GitHub CLI (if installed)
```bash
gh auth login
git push origin main
```

### Option 3: SSH Key (if configured)
```bash
git remote set-url origin git@github.com:BillAsmar/oc-pipeline.git
git push origin main
```

## After Successful Push

1. **Vercel will auto-deploy** (1-2 minutes)
2. **Add environment variables in Vercel:**
   - Go to: https://vercel.com/billasmar/oc-pipeline/settings/environment-variables
   - Add:
     - `VITE_SUPABASE_URL` = `https://cwrjhtpycynjzeiggyhf.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `[your-key]`
     - `VITE_API_URL` = (leave empty)
3. **Redeploy** after adding environment variables
4. **Configure Google OAuth in Supabase:**
   - Go to: https://supabase.com/dashboard/project/cwrjhtpycynjzeiggyhf/auth/providers
   - Enable Google provider
   - Add Google Client ID and Secret

## Commits Ready to Push
- Add Google OAuth authentication and remove localhost:3000 references
- Remove all localhost:3000 references - use Supabase only

## Security Notes
- ✅ .env.local is NOT being pushed (contains secrets)
- ✅ Only .env.example is in Git (template only)
- ✅ All sensitive data stays local or in Vercel/Supabase
