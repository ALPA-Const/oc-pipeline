# Week 1 Security Sprint: Implementation Guide
**Duration:** 5 business days (Mon-Fri)  
**Goal:** Eliminate all P0 security issues  
**Target Score:** 58% → 65% MVP

---

## 📋 Sprint Overview

This sprint focuses on fixing all **P0 Critical Security Issues** identified in the Elite MVP Analysis:

- **P0-001**: Mock authentication data removed
- **P0-002**: JWT token validation implemented  
- **P0-003**: Rate limiting deployed
- **P0-004**: RLS policies deployed
- **P0-005**: Admin module 90% complete
- **P0-006**: Input validation middleware
- **P0-008**: Audit logging implemented

---

## 🔍 Current State Assessment

### Mock Authentication Data Found

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `backend/src/middleware/auth.ts` | 50-57 | Hardcoded mock user | 🔴 P0 |
| `frontend/src/pages/api/auth/permissions.ts` | 13-19 | Mock users database | 🔴 P0 |

### Security Gaps Identified

- ✅ Frontend already uses Supabase Auth (`AuthContext.tsx`)
- ❌ Backend middleware uses mock data
- ❌ No rate limiting middleware
- ❌ No RLS policies deployed
- ❌ No audit logging system
- ❌ No input validation middleware

---

## 📅 Daily Task Breakdown

### Monday: Assessment & Planning

#### ✅ Task 1.1: Security Audit Complete

**Mock Data Inventory:**

1. **Backend Authentication Middleware**
   - File: `backend/src/middleware/auth.ts`
   - Lines: 50-57
   - Issue: Hardcoded mock user object
   - Risk: **CRITICAL** - Allows unauthorized access

2. **Frontend Permissions API**
   - File: `frontend/src/pages/api/auth/permissions.ts`
   - Lines: 13-19
   - Issue: Mock users database
   - Risk: **CRITICAL** - Bypasses real authentication

**Remediation Order:**
1. Fix backend auth middleware (P0-001)
2. Remove frontend mock permissions (P0-001)
3. Implement JWT validation (P0-002)
4. Add rate limiting (P0-003)
5. Deploy RLS policies (P0-004)

#### ✅ Task 1.2: Environment Setup Checklist

**Required Environment Variables:**

**Frontend (.env.local):**
```env
VITE_SUPABASE_URL=https://cwrjhtpycynjzeiggyhf.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=https://oc-pipeline-backend.onrender.com
```

**Backend (.env):**
```env
# Supabase Configuration
SUPABASE_URL=https://cwrjhtpycynjzeiggyhf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Server Configuration
PORT=4000
NODE_ENV=production

# Rate Limiting (Redis optional)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://ocpipeline.vercel.app,http://localhost:5173
```

**Supabase Configuration Required:**
- ✅ Auth enabled
- ✅ JWT expiry: 1 hour (access token)
- ✅ Refresh token expiry: 30 days
- ✅ RLS enabled on all tables
- ✅ Service role key configured

#### ✅ Task 1.3: Sprint Board Created

See `docs/sprints/WEEK1_SPRINT_BOARD.md` for detailed task breakdown.

---

### Tuesday: Mock Data Removal & JWT Foundation

#### Task 2.1: Remove Mock Authentication Data

**Files to Modify:**

1. `backend/src/middleware/auth.ts` - Remove mock user, implement Supabase JWT validation
2. `frontend/src/pages/api/auth/permissions.ts` - Remove mock users, use Supabase queries

**Implementation:** See `backend/src/middleware/auth.ts` (updated file)

#### Task 2.2: Implement Supabase Auth Integration

**Status:** ✅ Frontend already integrated  
**Required:** Backend JWT validation

**Implementation:** See updated `backend/src/middleware/auth.ts`

#### Task 2.3: JWT Token Configuration

**Configuration:**
- Access token: 1 hour expiry
- Refresh token: 30-day expiry
- Token signing: Supabase JWT secret
- Token validation: Signature + expiry check

**Implementation:** See `backend/src/config/jwt.ts` (new file)

---

### Wednesday: Rate Limiting & RLS Foundation

#### Task 3.1: Implement Rate Limiting

**Rate Limit Tiers:**
- Authentication endpoints: 5 requests/min
- API endpoints: 100 requests/min per user
- Public endpoints: 1000 requests/min per IP
- Admin endpoints: 50 requests/min per user

**Implementation:** See `backend/src/middleware/rateLimit.ts` (new file)

#### Task 3.2: Design RLS Policies

**Policy Structure:**
- Organization isolation (org_id)
- User access control
- Role-based access
- Project membership checks

**Implementation:** See `database/migrations/001_enable_rls.sql` (new file)

---

### Thursday: RLS Deployment & Admin Module

#### Task 4.1: Deploy RLS Policies

**Migration Strategy:**
- Zero-downtime deployment
- Enable RLS on all tables
- Create policies incrementally
- Verify with test queries
- Rollback procedure ready

**Implementation:** See `database/migrations/001_enable_rls.sql`

#### Task 4.2: Build Admin User Management

**Features:**
- User list with search/filter/sort
- Create user form
- Edit user details
- Deactivate/reactivate users
- User activity log

**Implementation:** See `frontend/src/pages/admin/UsersPage.tsx` (new file)

#### Task 4.3: Build Admin Role Management

**Features:**
- Role list with permissions matrix
- Create/edit roles
- Assign users to roles
- Role usage statistics

**Implementation:** See `frontend/src/pages/admin/RolesPage.tsx` (new file)

---

### Friday: Audit Logging & Testing

#### Task 5.1: Implement Audit Logging

**Audit Events:**
- User login/logout
- User CRUD operations
- Role/permission changes
- Data mutations
- Settings changes

**Implementation:** See `backend/src/middleware/audit.ts` (new file)

#### Task 5.2: Security Integration Testing

**Test Scenarios:**
- Invalid JWT token rejected
- Expired token rejected
- Rate limit enforced
- RLS policies verified
- Audit log captures operations

**Implementation:** See `backend/src/__tests__/security.test.ts` (new file)

#### Task 5.3: Completion Checklist

**Success Criteria:**
- ✅ All P0 issues resolved
- ✅ Admin module 90% complete
- ✅ Security tests passing
- ✅ Documentation complete

---

## 🎯 Success Criteria

### P0 Issues Resolution

- [ ] **P0-001**: Mock authentication data removed (100%)
- [ ] **P0-002**: JWT token validation implemented (100%)
- [ ] **P0-003**: Rate limiting deployed (100%)
- [ ] **P0-004**: RLS policies deployed (100%)
- [ ] **P0-006**: Input validation middleware (100%)
- [ ] **P0-008**: Audit logging implemented (100%)

### Module Completion

- [ ] Admin Module: 90% complete
  - [ ] User Management UI
  - [ ] Role Management UI
  - [ ] Audit Log Viewer

### Testing & Verification

- [ ] Security Tests: >80% coverage
- [ ] RLS Tests: All policies verified
- [ ] Rate Limiting: Tested and working
- [ ] Integration Tests: All passing

---

## 📊 MVP Score Progression

| Day | Focus | Target Score | Status |
|-----|-------|--------------|--------|
| Mon | Assessment & Planning | 58% | ✅ Planning |
| Tue | Auth & JWT | 60% | 🔄 In Progress |
| Wed | Rate Limiting & RLS | 62% | ⏳ Pending |
| Thu | RLS Deploy & Admin | 64% | ⏳ Pending |
| Fri | Audit & Testing | 65% | ⏳ Pending |

---

## 🚨 Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Auth integration issues | Daily testing, rollback plan | Use Supabase Auth docs |
| RLS performance | Query optimization, indexing | Defer complex policies |
| Rate limiting conflicts | Test with real traffic | Adjust limits if needed |
| Audit log bloat | Archival strategy, partitioning | Implement later if needed |

---

## 📦 Deliverables

### Code Files
- ✅ Updated `backend/src/middleware/auth.ts`
- ✅ New `backend/src/middleware/rateLimit.ts`
- ✅ New `backend/src/middleware/audit.ts`
- ✅ New `backend/src/middleware/validation.ts`
- ✅ New `database/migrations/001_enable_rls.sql`
- ✅ New `frontend/src/pages/admin/UsersPage.tsx`
- ✅ New `frontend/src/pages/admin/RolesPage.tsx`

### Documentation
- ✅ Security audit report
- ✅ Environment setup guide
- ✅ RLS policy documentation
- ✅ Deployment guide

### Testing
- ✅ Security test suite
- ✅ RLS verification queries
- ✅ Rate limiting tests

---

## ✅ Handoff to Phase 2

**Ready for Phase 2 when:**
- [ ] All P0 issues resolved
- [ ] Admin module 90% complete
- [ ] Security tests passing
- [ ] RLS policies verified
- [ ] Audit logging working

**Phase 2 Kickoff:** Monday Week 2  
**Phase 2 Focus:** Dashboard + Preconstruction modules

---

*Last Updated: 2025-12-01*

