# Security

## Current Security Status

This document outlines the security posture of the OC Pipeline project and known vulnerabilities.

### ✅ Resolved Vulnerabilities (January 2026)

The following critical and high-severity vulnerabilities have been addressed:

1. **React Router XSS Vulnerability** (HIGH)
   - **Package**: `@remix-run/router`
   - **Issue**: Cross-site Scripting (XSS) via Open Redirects (GHSA-2w69-qvjg-hvjx)
   - **Resolution**: Updated to v1.23.2
   - **CVSS**: 8.0

2. **Glob Command Injection** (HIGH)
   - **Package**: `glob`
   - **Issue**: Command injection via -c/--cmd flag (GHSA-5j98-mcp5-4vw2)
   - **Resolution**: Updated to secure version
   - **CVSS**: 7.5

3. **js-yaml Prototype Pollution** (MODERATE)
   - **Package**: `js-yaml`
   - **Issue**: Prototype pollution in merge operation (GHSA-mh29-5h37-fv8m)
   - **Resolution**: Updated to v4.1.1+
   - **CVSS**: 5.3

### ⚠️ Known Limitations

The following vulnerabilities cannot be immediately resolved due to upstream constraints:

1. **xlsx Package Vulnerabilities** (HIGH - Accept Risk)
   - **Package**: `xlsx@0.18.5`
   - **Issues**:
     - Prototype Pollution (GHSA-4r6h-8v6p-xvw6) - CVSS 7.8
     - Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9) - CVSS 7.5
   - **Status**: No fix available - v0.18.5 is the latest version on npm
   - **Impact**: Used for Excel file import/export functionality
   - **Mitigation**: 
     - Files are only processed from authenticated users
     - Consider migrating to alternative library (exceljs, sheetjs-style) in future
   - **Affected Files**:
     - `frontend/src/components/chat/ChatInput.tsx`
     - `frontend/src/pages/ProjectData.tsx`
     - `frontend/src/pages/admin/Import.tsx`
     - `frontend/src/services/pipeline-admin.service.ts`
     - `frontend/src/services/project-data.service.ts`
     - `frontend/src/utils/import-parser.ts`

2. **Vite/esbuild Development Server Issue** (MODERATE - Development Only)
   - **Package**: `esbuild@<=0.24.2`, `vite@5.4.21`
   - **Issue**: Development server can accept requests from any website (GHSA-67mh-4wv8-2f99)
   - **Status**: Fix requires breaking change upgrade to Vite v7
   - **Impact**: Development environment only, not applicable to production builds
   - **Mitigation**: Production builds are not affected
   - **CVSS**: 5.3

## Security Best Practices

### For Developers

1. **Keep Dependencies Updated**: Run `npm audit` regularly
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Auto-fix non-breaking issues
   npm audit fix
   ```

2. **Review Breaking Changes**: Before running `npm audit fix --force`, review the changes:
   ```bash
   npm audit fix --dry-run --force
   ```

3. **Test After Updates**: Always run tests after updating dependencies
   ```bash
   cd frontend
   npm run build
   npm run test  # if tests exist
   ```

### For Production Deployments

1. **Use Production Builds**: Never deploy the development server
   ```bash
   cd frontend
   npm run build
   # Deploy the dist/ directory
   ```

2. **Validate User Input**: Always sanitize and validate user-uploaded files
3. **Implement CSP Headers**: Add Content Security Policy headers to prevent XSS
4. **Regular Security Scans**: Schedule periodic security audits

## Reporting Security Issues

If you discover a security vulnerability, please email security@alpaconstruction.com or create a private security advisory on GitHub.

**Do not** create public issues for security vulnerabilities.

## Security Scan History

| Date | Action | Result |
|------|--------|--------|
| 2026-01-13 | Security audit and fixes | 5 HIGH/MODERATE issues fixed, 2 accepted risks documented |
| 2025-12-25 | Snyk automated PRs opened | Multiple upgrade PRs created for various dependencies |

## References

- [npm Security Best Practices](https://docs.npmjs.com/cli/v9/using-npm/security)
- [Snyk Vulnerability Database](https://security.snyk.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
