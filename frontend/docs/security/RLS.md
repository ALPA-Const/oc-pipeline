# Row-Level Security (RLS) Documentation

## Overview

Row-Level Security (RLS) is enabled on all Supabase tables to enforce least-privilege access control. This document describes the RLS policies, their rationale, and testing procedures.

## Migration Files

- **Migration:** `database/migration_002_enable_rls.sql`
- **Rollback:** `database/rollback_002_disable_rls.sql`

## Tables with RLS Enabled

| Table | RLS Status | Purpose |
|-------|-----------|---------|
| `pipeline_projects` | ✅ Enabled | Construction project data |
| `pipeline_stages` | ✅ Enabled | Reference data for project stages |
| `pipeline_set_aside_types` | ✅ Enabled | Reference data for set-aside types |

## RLS Policies

### 1. pipeline_projects

#### Policy: `allow_authenticated_read_projects`
- **Type:** SELECT
- **Role:** authenticated
- **Rule:** `true` (all authenticated users can read all projects)
- **Rationale:** Dashboard requires visibility across all projects for analytics and reporting

#### Policy: `allow_service_role_all_projects`
- **Type:** ALL (SELECT, INSERT, UPDATE, DELETE)
- **Role:** service_role
- **Rule:** `true` (full access)
- **Rationale:** Admin operations and data migrations require unrestricted access

#### Policy: `allow_anon_read_projects`
- **Type:** SELECT
- **Role:** anon
- **Rule:** `true` (all anonymous users can read projects)
- **Rationale:** Public dashboards require read access without authentication
- **Note:** Remove this policy if public access is not required

### 2. pipeline_stages (Reference Data)

#### Policy: `allow_all_read_stages`
- **Type:** SELECT
- **Role:** public
- **Rule:** `true` (everyone can read)
- **Rationale:** Reference data needed for UI dropdowns and filters

#### Policy: `allow_service_role_modify_stages`
- **Type:** ALL
- **Role:** service_role
- **Rule:** `true` (full access)
- **Rationale:** Only admins should modify reference data

### 3. pipeline_set_aside_types (Reference Data)

#### Policy: `allow_all_read_set_aside_types`
- **Type:** SELECT
- **Role:** public
- **Rule:** `true` (everyone can read)
- **Rationale:** Reference data needed for UI dropdowns and filters

#### Policy: `allow_service_role_modify_set_aside_types`
- **Type:** ALL
- **Role:** service_role
- **Rule:** `true` (full access)
- **Rationale:** Only admins should modify reference data

## Access Control Matrix

| Role | pipeline_projects | pipeline_stages | pipeline_set_aside_types |
|------|------------------|-----------------|-------------------------|
| `anon` | SELECT | SELECT | SELECT |
| `authenticated` | SELECT | SELECT | SELECT |
| `service_role` | ALL | ALL | ALL |
| `public` (write) | ❌ Revoked | ❌ Revoked | ❌ Revoked |

## Future: Multi-Tenancy Support

When multi-tenancy is implemented, add tenant-specific policies:

```sql
-- Example: Users can only read projects in their tenant
CREATE POLICY "users_read_own_tenant_projects"
ON pipeline_projects
FOR SELECT
TO authenticated
USING (
  tenant_id = auth.uid()::text 
  OR tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Example: Users can only update projects they own
CREATE POLICY "users_update_own_projects"
ON pipeline_projects
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());
```

## Testing RLS Policies

### 1. Verify RLS is Enabled

```sql
-- Run this query to check RLS status
SELECT * FROM check_rls_enabled();

-- Expected output:
-- table_name                  | rls_enabled
-- ---------------------------+-------------
-- pipeline_projects          | t
-- pipeline_stages            | t
-- pipeline_set_aside_types   | t
```

### 2. Test Authenticated User Access

```sql
-- As authenticated user, should succeed
SELECT * FROM pipeline_projects LIMIT 5;

-- As authenticated user, should fail (no write access)
INSERT INTO pipeline_projects (name, stage_id, value) 
VALUES ('Test Project', 'opp_proposal', 1000000);
-- Expected error: "new row violates row-level security policy"
```

### 3. Test Anonymous User Access

```sql
-- As anon user, should succeed (read-only)
SELECT * FROM pipeline_projects LIMIT 5;

-- As anon user, should fail (no write access)
DELETE FROM pipeline_projects WHERE id = 'some-id';
-- Expected error: "permission denied for table pipeline_projects"
```

### 4. Test Service Role Access

```sql
-- As service_role, should succeed (full access)
INSERT INTO pipeline_projects (name, stage_id, value) 
VALUES ('Admin Test Project', 'opp_proposal', 5000000);

UPDATE pipeline_projects 
SET value = 6000000 
WHERE name = 'Admin Test Project';

DELETE FROM pipeline_projects 
WHERE name = 'Admin Test Project';
```

### 5. Test Cross-Tenant Access (Future)

```sql
-- When multi-tenancy is implemented, test that User A cannot access User B's projects
-- As User A (tenant_id = 'tenant-a')
SELECT * FROM pipeline_projects WHERE tenant_id = 'tenant-b';
-- Expected: Empty result set (RLS blocks access)
```

## Automated Test Suite

Create integration tests in `src/services/__tests__/rls.test.ts`:

```typescript
describe('RLS Policy Enforcement', () => {
  it('should allow authenticated users to read projects', async () => {
    const { data, error } = await supabase
      .from('pipeline_projects')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should prevent authenticated users from inserting projects', async () => {
    const { error } = await supabase
      .from('pipeline_projects')
      .insert({
        name: 'Unauthorized Project',
        stage_id: 'opp_proposal',
        value: 1000000,
      });
    
    expect(error).toBeDefined();
    expect(error?.message).toContain('row-level security policy');
  });

  it('should allow service role to insert projects', async () => {
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data, error } = await serviceClient
      .from('pipeline_projects')
      .insert({
        name: 'Admin Test Project',
        stage_id: 'opp_proposal',
        value: 5000000,
      })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // Cleanup
    await serviceClient
      .from('pipeline_projects')
      .delete()
      .eq('id', data.id);
  });
});
```

## Troubleshooting

### Issue: "permission denied for table"
- **Cause:** User role doesn't have required permissions
- **Fix:** Check that RLS policies are correctly applied and user is authenticated

### Issue: "new row violates row-level security policy"
- **Cause:** INSERT/UPDATE/DELETE attempted without proper policy
- **Fix:** Use service_role for admin operations, or add appropriate WITH CHECK policy

### Issue: Empty result set when data exists
- **Cause:** RLS policy filtering out rows
- **Fix:** Verify USING clause in policy matches user's context (e.g., tenant_id)

### Issue: RLS not enforcing after migration
- **Cause:** RLS might be disabled or policies not created
- **Fix:** Run `SELECT * FROM check_rls_enabled();` and verify output

## Security Best Practices

1. **Least Privilege:** Grant minimum necessary permissions
2. **Service Role:** Use only for admin operations, never expose to frontend
3. **Audit Logging:** Log all service_role operations for compliance
4. **Policy Testing:** Write automated tests for every RLS policy
5. **Regular Review:** Audit policies quarterly for security gaps
6. **Tenant Isolation:** When implementing multi-tenancy, ensure strict tenant_id checks
7. **PII Protection:** Add policies to restrict access to sensitive fields

## Compliance Notes

- **GDPR:** RLS policies support data access restrictions by user
- **SOC 2:** RLS provides access control audit trail
- **HIPAA:** RLS can enforce patient data isolation (if applicable)
- **FedRAMP:** RLS supports least-privilege access requirements

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-XX | 1.0 | Initial RLS implementation | DevOps Team |

## Support

For RLS-related issues or questions:
- **Slack:** #alpa-devops
- **Email:** devops@alpaconstruction.com
- **Escalation:** CTO