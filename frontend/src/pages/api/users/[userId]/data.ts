/**
 * Right-to-Delete Endpoint
 * DELETE /api/users/{userId}/data
 * 
 * Implements GDPR/CCPA compliant right-to-delete
 * Anonymizes PII using SHA-256 hash
 */

import { errorHandler } from '@/lib/error-handler';
import { ErrorCode } from '@/types/error.types';

interface DeleteDataResponse {
  deleted_at: string;
  anonymized_fields: string[];
  audit_log_entry: string;
  grace_period_ends: string;
  trace_id: string;
}

/**
 * SHA-256 hash function for PII anonymization
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Anonymize user PII
 * This is a mock implementation - replace with actual Supabase update
 */
async function anonymizeUserData(userId: string, requestingUserId: string): Promise<DeleteDataResponse> {
  const traceId = errorHandler.generateTraceId();
  const deletedAt = new Date().toISOString();
  const gracePeriodEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Authorization check: user can only delete their own data, or admin can delete any
  if (userId !== requestingUserId) {
    // In production, check if requestingUserId has admin role
    const isAdmin = false; // Mock check
    if (!isAdmin) {
      throw errorHandler.createErrorResponse(
        ErrorCode.FORBIDDEN,
        'You can only delete your own data',
        403,
        traceId
      );
    }
  }

  // PII fields to anonymize
  const piiFields = ['email', 'phone', 'full_name', 'address', 'ssn'];
  
  // Generate SHA-256 hashes for each field
  const anonymizedFields: string[] = [];
  for (const field of piiFields) {
    const mockValue = `${field}_${userId}`;
    const hash = await sha256(mockValue);
    // In production, update database: UPDATE users SET field = hash WHERE id = userId
    anonymizedFields.push(field);
  }

  // Create immutable audit log entry
  const auditLogEntry = `evt_delete_${traceId.substring(0, 8)}`;
  // In production: INSERT INTO events (action, entity_type, entity_id, ...) VALUES (...)

  return {
    deleted_at: deletedAt,
    anonymized_fields: anonymizedFields,
    audit_log_entry: auditLogEntry,
    grace_period_ends: gracePeriodEnds,
    trace_id: traceId,
  };
}

/**
 * Express/Vite handler
 * In production, this would be a proper API route
 */
export default async function handler(req: Request, userId: string): Promise<Response> {
  try {
    // Only allow DELETE method
    if (req.method !== 'DELETE') {
      const envelope = errorHandler.createErrorResponse(
        ErrorCode.INVALID_REQUEST,
        'Method not allowed',
        405
      );
      return new Response(JSON.stringify(envelope), {
        status: envelope.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for Idempotency-Key header
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      const envelope = errorHandler.createErrorResponse(
        ErrorCode.INVALID_REQUEST,
        'Idempotency-Key header required',
        400
      );
      return new Response(JSON.stringify(envelope), {
        status: envelope.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract requesting user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    const requestingUserId = authHeader?.replace('Bearer ', '') || '';

    if (!requestingUserId) {
      const envelope = errorHandler.createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
      return new Response(JSON.stringify(envelope), {
        status: envelope.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Anonymize user data
    const result = await anonymizeUserData(userId, requestingUserId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const envelope = errorHandler.handleError(error);
    return new Response(JSON.stringify(envelope), {
      status: envelope.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}