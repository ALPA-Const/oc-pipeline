# Secrets Management Documentation

## Overview

This document describes how secrets (API keys, database credentials, tokens) are managed in the ALPA Construction application. All secrets must be stored securely and never committed to version control.

## Secrets Inventory

### Supabase Secrets

| Secret | Environment Variable | Purpose | Rotation Frequency |
|--------|---------------------|---------|-------------------|
| Supabase URL | `VITE_SUPABASE_URL` | Supabase project endpoint | Never (project-specific) |
| Supabase Anon Key | `VITE_SUPABASE_ANON_KEY` | Public client-side key | Quarterly |
| Supabase Service Role Key | `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations | Quarterly |

### Third-Party Integrations

| Secret | Environment Variable | Purpose | Rotation Frequency |
|--------|---------------------|---------|-------------------|
| Sentry DSN | `VITE_SENTRY_DSN` | Error tracking | Annually |
| Sentry Auth Token | `SENTRY_AUTH_TOKEN` | CI/CD releases | Annually |

### Future Secrets (Planned)

| Secret | Environment Variable | Purpose | Rotation Frequency |
|--------|---------------------|---------|-------------------|
| BuildingConnected API Key | `BUILDING_CONNECTED_API_KEY` | Bid data sync | Quarterly |
| Auth0 Client Secret | `AUTH0_CLIENT_SECRET` | User authentication | Quarterly |
| AWS Access Key | `AWS_ACCESS_KEY_ID` | Cloud infrastructure | Quarterly |

## Storage Locations

### Development Environment

**Local Development:**
- Store in `.env.local` file (gitignored)
- Never commit `.env.local` to version control
- Use `.env.example` as template (no real values)

**Example `.env.local`:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sentry Configuration
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
SENTRY_AUTH_TOKEN=sntrys_abc123def456...
```

### Production Environment

**Vercel/Netlify:**
- Store in platform's environment variables UI
- Enable "Encrypted" option for sensitive values
- Separate secrets per environment (staging, production)

**GitHub Actions:**
- Store in repository secrets (Settings → Secrets and variables → Actions)
- Use `${{ secrets.SECRET_NAME }}` syntax in workflows
- Never log secret values in CI output

**Supabase:**
- Service role key stored in Supabase dashboard
- Rotate keys via Supabase Settings → API

## Secret Rotation Procedure

### 1. Supabase Anon Key Rotation

```bash
# Step 1: Generate new key in Supabase dashboard
# Settings → API → Generate new anon key

# Step 2: Update environment variables
# - Local: Update .env.local
# - Vercel: Update in dashboard
# - GitHub Actions: Update repository secret

# Step 3: Deploy new version
pnpm run build
vercel --prod

# Step 4: Revoke old key in Supabase dashboard
# Settings → API → Revoke old anon key

# Step 5: Verify application still works
curl https://your-app.vercel.app/api/health
```

### 2. Supabase Service Role Key Rotation

```bash
# WARNING: Service role key rotation requires careful coordination

# Step 1: Generate new service role key in Supabase dashboard
# Settings → API → Generate new service role key

# Step 2: Update CI/CD secrets immediately
# GitHub Actions: Update SUPABASE_SERVICE_ROLE_KEY secret

# Step 3: Update server-side environment variables
# Vercel: Update SUPABASE_SERVICE_ROLE_KEY

# Step 4: Deploy and verify
pnpm run build
vercel --prod

# Step 5: Test admin operations
# Run integration tests that use service role

# Step 6: Revoke old key only after verification
# Settings → API → Revoke old service role key
```

### 3. Sentry DSN Rotation

```bash
# Step 1: Create new DSN in Sentry dashboard
# Settings → Projects → [Your Project] → Client Keys (DSN)

# Step 2: Update environment variables
# Local: Update .env.local
# Vercel: Update VITE_SENTRY_DSN
# GitHub Actions: Update VITE_SENTRY_DSN secret

# Step 3: Deploy new version
pnpm run build
vercel --prod

# Step 4: Verify errors are being captured
# Trigger test error and check Sentry dashboard

# Step 5: Disable old DSN
# Sentry → Settings → Client Keys → Disable old DSN
```

## Secrets in CI/CD

### GitHub Actions Secrets

Required secrets for CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

### Setting Up GitHub Secrets

```bash
# Using GitHub CLI
gh secret set VITE_SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set VITE_SENTRY_DSN --body "https://abc123@o123456.ingest.sentry.io/7890123"
gh secret set SENTRY_AUTH_TOKEN --body "sntrys_abc123def456..."

# Verify secrets are set
gh secret list
```

## Security Best Practices

### ✅ DO

1. **Use Environment Variables:** Never hardcode secrets in source code
2. **Gitignore Secrets:** Ensure `.env.local` is in `.gitignore`
3. **Rotate Regularly:** Follow rotation schedule (quarterly for critical secrets)
4. **Least Privilege:** Use anon key for client-side, service role only for admin
5. **Audit Access:** Log who accesses secrets and when
6. **Encrypt at Rest:** Use platform encryption features (Vercel, GitHub)
7. **Separate Environments:** Different secrets for dev, staging, production
8. **Document Rotation:** Keep this document updated with rotation dates

### ❌ DON'T

1. **Never Commit Secrets:** Don't commit `.env.local` or hardcoded keys
2. **Don't Share via Chat:** Use secure secret sharing tools (1Password, Vault)
3. **Don't Log Secrets:** Redact secrets from logs and error messages
4. **Don't Reuse Secrets:** Each environment should have unique secrets
5. **Don't Email Secrets:** Use encrypted channels only
6. **Don't Store in Browser:** Never use localStorage for sensitive secrets
7. **Don't Expose Service Role:** Never send service role key to frontend
8. **Don't Skip Rotation:** Follow rotation schedule strictly

## Secret Leakage Response

If a secret is accidentally committed or exposed:

### Immediate Actions (Within 1 Hour)

1. **Revoke the Secret:**
   - Supabase: Settings → API → Revoke key
   - Sentry: Settings → Client Keys → Disable DSN
   - GitHub: Settings → Secrets → Delete secret

2. **Generate New Secret:**
   - Create replacement secret immediately
   - Update all environments

3. **Deploy New Version:**
   - Push emergency deployment with new secrets
   - Verify application works

4. **Notify Team:**
   - Post in #alpa-security Slack channel
   - Document incident in security log

### Follow-Up Actions (Within 24 Hours)

1. **Git History Cleanup:**
   ```bash
   # Use BFG Repo-Cleaner to remove secret from history
   git clone --mirror https://github.com/alpa/construction-dashboard.git
   bfg --replace-text passwords.txt construction-dashboard.git
   cd construction-dashboard.git
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

2. **Audit Access Logs:**
   - Check Supabase logs for unauthorized access
   - Review Sentry events for anomalies
   - Analyze GitHub Actions logs

3. **Post-Mortem:**
   - Document how leak occurred
   - Implement preventive measures
   - Update this document with lessons learned

## Compliance & Audit

### Audit Trail

All secret rotations must be logged:

| Date | Secret | Action | Performed By | Reason |
|------|--------|--------|--------------|--------|
| 2025-01-15 | SUPABASE_ANON_KEY | Rotated | DevOps Team | Quarterly rotation |
| 2025-01-20 | SENTRY_DSN | Rotated | DevOps Team | Project migration |

### Compliance Requirements

- **SOC 2:** Secrets must be rotated quarterly
- **GDPR:** Service role key access must be audited
- **HIPAA:** Encryption at rest and in transit required (if applicable)
- **FedRAMP:** Secret rotation every 90 days (if applicable)

## Tools & Resources

### Recommended Tools

1. **1Password:** Team secret sharing
2. **HashiCorp Vault:** Enterprise secret management
3. **AWS Secrets Manager:** Cloud-native secret storage
4. **Doppler:** Developer-friendly secret sync
5. **git-secrets:** Prevent committing secrets

### Installation: git-secrets

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
sudo apt-get install git-secrets  # Linux

# Set up in repository
cd /workspace/shadcn-ui
git secrets --install
git secrets --register-aws  # Prevents AWS keys
git secrets --add 'SUPABASE_SERVICE_ROLE_KEY'
git secrets --add 'SENTRY_AUTH_TOKEN'

# Scan repository for secrets
git secrets --scan
```

## Contact & Support

For secrets-related issues:
- **Slack:** #alpa-security
- **Email:** security@alpaconstruction.com
- **Emergency:** CTO (direct message)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial secrets documentation | DevOps Team |

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)