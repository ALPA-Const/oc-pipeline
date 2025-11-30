# Data Governance Policy
**ALPA Construction CRM - Version 1.0**  
**Effective Date:** 2025-01-01  
**Last Updated:** 2025-01-01

## 1. Purpose

This policy establishes data governance standards for ALPA Construction CRM to ensure:
- Compliance with GDPR, CCPA, and construction industry regulations
- Data privacy and security
- Audit trail integrity
- Right-to-delete compliance

## 2. PII (Personally Identifiable Information) Matrix

### 2.1 PII Fields by Table

| Table | PII Fields | Storage Location | Redaction Rules |
|-------|-----------|------------------|-----------------|
| `users` | `email`, `phone`, `full_name`, `address` | Primary DB | SHA-256 hash on deletion |
| `events` | `metadata.ip_address`, `metadata.user_agent` | Events table | Redacted after 90 days |
| `projects` | `client.contact_email`, `client.contact_phone` | Primary DB | Redacted on project archive |
| `action_items` | `comments[].text` (may contain names) | Primary DB | Not redacted (business record) |
| `documents` | `uploaded_by`, `filename` (may contain names) | S3 + DB metadata | Filename sanitized on upload |

### 2.2 PII Protection Measures

- **Encryption at Rest:** All PII encrypted using AES-256
- **Encryption in Transit:** TLS 1.3 for all API calls
- **Access Control:** RLS policies enforce org isolation
- **Audit Logging:** All PII access logged in events table
- **Retention:** PII retained per data retention schedule (Section 4)

## 3. Right-to-Delete Protocol

### 3.1 User Deletion Request Process

1. **Request Submission:** User submits deletion request via support ticket or API
2. **Verification:** Identity verified via email confirmation + 2FA
3. **Grace Period:** 30-day grace period before deletion (allows undo)
4. **Anonymization:** After grace period:
   - `email` → SHA-256 hash (irreversible)
   - `phone` → SHA-256 hash (irreversible)
   - `full_name` → "Deleted User [hash]"
   - `address` → NULL
5. **Audit Log:** Deletion event logged (immutable)
6. **Retention:** Anonymized record retained for 7 years (compliance)

### 3.2 Exceptions to Deletion

The following data is **NOT** deleted (legal/business requirements):
- Financial transactions (7-year retention for tax/audit)
- Safety incident reports (10-year retention for liability)
- Project records (anonymized user references retained)
- Audit logs (immutable, 7-year retention)

### 3.3 API Endpoint

```
DELETE /api/users/{userId}/data
Authorization: Bearer <token>
Idempotency-Key: <uuid>

Response:
{
  "deleted_at": "2025-01-15T10:30:00Z",
  "anonymized_fields": ["email", "phone", "full_name"],
  "audit_log_entry": "evt_abc123",
  "grace_period_ends": "2025-02-14T10:30:00Z"
}
```

## 4. Data Retention Schedule

### 4.1 Hot Storage (Immediate Access)

| Data Type | Retention | Location |
|-----------|-----------|----------|
| Active projects | Until archived | Primary DB |
| Recent events | 30 days | Events table (hot partition) |
| User sessions | 24 hours | Redis cache |
| API logs | 7 days | CloudWatch |

### 4.2 Warm Storage (Archive)

| Data Type | Retention | Location |
|-----------|-----------|----------|
| Archived projects | 3 years | Primary DB (archived flag) |
| Events (31-365 days) | 365 days | Events table (warm partition) |
| Documents | 3 years | S3 Glacier |

### 4.3 Cold Storage (Compliance)

| Data Type | Retention | Location |
|-----------|-----------|----------|
| Financial records | 7 years | S3 Glacier Deep Archive |
| Safety incidents | 10 years | S3 Glacier Deep Archive |
| Audit logs | 7 years | Events table (cold partition) |

## 5. Log Redaction Rules

### 5.1 Automatic Redaction

- **IP Addresses:** Redacted after 90 days (events.metadata.ip_address)
- **User Agents:** Redacted after 90 days (events.metadata.user_agent)
- **Session IDs:** Redacted after 30 days
- **API Keys:** Never logged (masked as `***`)

### 5.2 PII in Logs

- **Email:** Logged as `user_***@domain.com` (first 4 chars + domain)
- **Phone:** Logged as `+1-***-***-1234` (last 4 digits only)
- **Names:** Logged as initials only (e.g., "John Doe" → "JD")

## 6. Secret Rotation Policy

### 6.1 Rotation Schedule

| Secret Type | Rotation Frequency | Owner |
|-------------|-------------------|-------|
| Database passwords | 90 days | DevOps |
| API keys (external services) | 90 days | Engineering |
| JWT signing keys | 180 days | Security |
| Encryption keys | 365 days | Security |
| Service account credentials | 90 days | DevOps |

### 6.2 Rotation Process

1. Generate new secret
2. Deploy new secret to production (dual-key period)
3. Update all services to use new secret
4. Verify all services working
5. Revoke old secret after 7 days
6. Log rotation event in audit trail

## 7. Compliance Checkpoints

### 7.1 Quarterly Reviews

- Review PII access logs for anomalies
- Verify RLS policies are enforced
- Audit data retention compliance
- Test right-to-delete process

### 7.2 Annual Audits

- External security audit (penetration testing)
- GDPR compliance audit
- Data retention policy review
- Secret rotation verification

## 8. Incident Response

### 8.1 Data Breach Protocol

1. **Detection:** Automated alerts + manual monitoring
2. **Containment:** Isolate affected systems within 1 hour
3. **Assessment:** Determine scope and impact within 4 hours
4. **Notification:** Notify affected users within 72 hours (GDPR requirement)
5. **Remediation:** Patch vulnerabilities within 7 days
6. **Post-Mortem:** Document lessons learned within 14 days

### 8.2 Breach Notification Template

```
Subject: Security Incident Notification

Dear [User],

We are writing to inform you of a security incident that may have affected your data.

What happened: [Brief description]
Data affected: [List of PII fields]
Actions taken: [Security measures implemented]
What you should do: [User action items]

For questions, contact: security@alpa-construction.com
```

## 9. Policy Updates

This policy is reviewed quarterly and updated as needed. All changes are:
- Documented in version control
- Communicated to all employees
- Reflected in system implementation within 30 days

**Policy Owner:** Chief Information Security Officer (CISO)  
**Contact:** security@alpa-construction.com  
**Next Review Date:** 2025-04-01