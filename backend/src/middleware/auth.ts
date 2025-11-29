import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  _oldValue?: Record<string, unknown> | null,
  _newValue?: Record<string, unknown> | null
): Promise<void> {
  try {
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Audit event:', { userId, entityType, entityId, action });
    }

    // TODO: Implement database logging when audit_logs table is available
    // const { query } = await import('../config/database');
    // await query(
    //   'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value) VALUES ($1, $2, $3, $4, $5, $6)',
    //   [userId, entityType, entityId, action, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null]
    // );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}
