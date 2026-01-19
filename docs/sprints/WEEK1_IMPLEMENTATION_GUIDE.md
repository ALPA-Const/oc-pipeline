# Week 1 Security Sprint: Implementation Guide

This guide provides step-by-step instructions for implementing all Week 1 security fixes.

---

## 🔴 CRITICAL: Mock Authentication Removal

### Current Issue

**File:** `backend/src/middleware/auth.ts`  
**Lines:** 50-57  
**Problem:** Hardcoded mock user bypasses all authentication

```typescript
// CURRENT (INSECURE):
req.user = {
  id: "mock-user-id",
  org_id: "mock-org-id",
  email: "user@example.com",
  roles: ["admin"],
  permissions: ["view", "create", "edit", "delete", "approve"],
};
```

### Solution: Implement Real Supabase JWT Validation

**Step 1:** Update `backend/src/middleware/auth.ts`

Replace the mock authentication with real Supabase JWT validation:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No valid authentication token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // Validate JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Get user's organization and roles from database
    // TODO: Query users table for org_id and roles
    // For now, extract from user metadata
    req.user = {
      id: user.id,
      org_id: user.user_metadata?.org_id || 'unknown',
      email: user.email || '',
      roles: user.user_metadata?.roles || ['user'],
      permissions: [], // Will be populated from roles
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
    });
  }
}
```

**Step 2:** Remove Mock Permissions

**File:** `frontend/src/pages/api/auth/permissions.ts`

Replace mock users database with Supabase query:

```typescript
import { supabase } from '@/lib/supabase';

export async function getPermissions(userId: string) {
  // Query real database instead of mock
  const { data: user, error } = await supabase
    .from('users')
    .select('role, org_id')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Get permissions from role_permissions table
  const { data: permissions } = await supabase
    .from('role_permissions')
    .select('permission')
    .eq('role_code', user.role);

  return {
    role: user.role,
    permissions: permissions?.map(p => p.permission) || [],
    org_id: user.org_id,
    user_id: userId,
  };
}
```

---

## 🛡️ Rate Limiting Implementation

### Step 1: Install Dependencies

```bash
cd backend
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

### Step 2: Create Rate Limiting Middleware

**File:** `backend/src/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Authentication endpoints: 5 requests/min
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints: 100 requests/min per user
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator based on user ID if authenticated
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

// Admin endpoints: 50 requests/min per user
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many admin requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

### Step 3: Apply Rate Limiting to Routes

**File:** `backend/src/index.ts`

```typescript
import { authLimiter, apiLimiter, adminLimiter } from './middleware/rateLimit';

// Apply to auth routes
app.use('/api/auth', authLimiter);

// Apply to API routes
app.use('/api', apiLimiter);

// Apply to admin routes
app.use('/api/admin', adminLimiter);
```

---

## 🔐 RLS Policies Implementation

### Step 1: Create RLS Migration

**File:** `database/migrations/001_enable_rls.sql`

```sql
-- Enable RLS on all core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals_isdc ENABLE ROW LEVEL SECURITY;
ALTER TABLE specifications_isdc ENABLE ROW LEVEL SECURITY;
ALTER TABLE closeout_documents ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy
CREATE POLICY "Users can only access their own organization's data"
  ON organizations
  FOR ALL
  USING (id = current_setting('app.current_org_id')::uuid);

-- Users can view users in their organization
CREATE POLICY "Users can view users in their org"
  ON users
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Projects isolation
CREATE POLICY "Users can access projects in their org"
  ON projects
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- ISDC module isolation
CREATE POLICY "Users can access submittals in their org"
  ON submittals_isdc
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );

-- Similar policies for specifications and closeout documents
CREATE POLICY "Users can access specifications in their org"
  ON specifications_isdc
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );

CREATE POLICY "Users can access closeout documents in their org"
  ON closeout_documents
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );
```

### Step 2: Set Organization Context in Middleware

**File:** `backend/src/middleware/auth.ts`

Add after user authentication:

```typescript
// Set organization context for RLS
await supabase.rpc('set_config', {
  setting_name: 'app.current_org_id',
  setting_value: req.user.org_id,
  is_local: true,
});
```

---

## 📝 Input Validation Implementation

### Step 1: Install Dependencies

```bash
cd backend
npm install express-validator
```

### Step 2: Create Validation Middleware

**File:** `backend/src/middleware/validation.ts`

```typescript
import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
      },
    });
  }
  next();
};

// Common validation chains
export const uuidValidation = (field: string) => {
  return body(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);
};

export const emailValidation = (field: string = 'email') => {
  return body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage(`${field} must be a valid email`);
};
```

### Step 3: Apply Validation to Routes

**Example:** `backend/src/routes/submittals.ts`

```typescript
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

router.post('/',
  body('project_id').isUUID(),
  body('submittal_number').isString().trim().notEmpty(),
  body('submittal_title').isString().trim().notEmpty(),
  validateRequest,
  createSubmittal
);
```

---

## 📊 Audit Logging Implementation

### Step 1: Create Audit Log Table

**File:** `database/migrations/002_create_audit_log.sql`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  org_id UUID REFERENCES organizations(id),
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  entity_type VARCHAR(100) NOT NULL, -- 'user', 'project', 'submittal', etc.
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  correlation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs in their org"
  ON audit_logs
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

### Step 2: Create Audit Middleware

**File:** `backend/src/middleware/audit.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export function auditLog(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    
    res.json = function(data: any) {
      // Log after response is sent
      if (req.user) {
        const auditEntry = {
          user_id: req.user.id,
          org_id: req.user.org_id,
          action,
          entity_type: entityType,
          entity_id: req.params.id || req.body.id,
          before_data: req.body.before || null,
          after_data: req.body.after || data,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          correlation_id: req.headers['x-correlation-id'] || null,
        };

        supabase.from('audit_logs').insert(auditEntry).catch(console.error);
      }

      return originalSend.call(this, data);
    };

    next();
  };
}
```

### Step 3: Apply Audit Logging to Routes

**Example:**

```typescript
import { auditLog } from '../middleware/audit';

router.post('/api/users', 
  authenticate,
  auditLog('CREATE', 'user'),
  createUser
);
```

---

## ✅ Testing Checklist

### Security Tests

- [ ] Invalid JWT token rejected
- [ ] Expired token rejected
- [ ] Rate limit enforced on auth endpoints
- [ ] Rate limit enforced on API endpoints
- [ ] User cannot access other org's data (RLS)
- [ ] Audit log captures all operations
- [ ] Input validation rejects invalid data

### Integration Tests

- [ ] Login flow works end-to-end
- [ ] Token refresh works
- [ ] Logout revokes session
- [ ] RLS policies prevent cross-org access
- [ ] Rate limiting doesn't break normal usage

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Supabase RLS policies tested
- [ ] Rate limits tested
- [ ] Audit logging verified

### Deployment Steps

1. Deploy database migrations
2. Deploy backend code
3. Deploy frontend code
4. Verify health checks
5. Test authentication flow
6. Monitor error logs

### Post-Deployment

- [ ] Verify authentication working
- [ ] Check rate limiting logs
- [ ] Verify RLS policies active
- [ ] Confirm audit logs recording
- [ ] Monitor performance metrics

---

*Last Updated: 2025-12-01*

