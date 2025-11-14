import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { asyncHandler, AppError, Errors } from '../middleware/errorHandler';
import { logAuditEvent } from '../middleware/auth';

const router = Router();

// JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// ============================================================================
// STANDARD AUTH ROUTES
// ============================================================================

// Sign up
router.post(
  '/signup',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Errors.VALIDATION_ERROR('Email and password required');
    }

    try {
      const result = await query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at) 
         VALUES ($1, crypt($2, gen_salt('bf')), now(), now(), now()) 
         RETURNING id, email`,
        [email, password]
      );

      const user = result.rows[0];

      // Assign Viewer role by default
      const roleResult = await query(
        'SELECT id FROM public.roles WHERE name = $1',
        ['Viewer']
      );

      if (roleResult.rows.length > 0) {
        await query(
          'INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleResult.rows[0].id]
        );
      }

      // Log audit event
      await logAuditEvent(user.id, 'user', user.id, 'create', null, { email });

      res.status(201).json({
        message: 'User created successfully',
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      if (error.code === '23505') {
        throw Errors.CONFLICT('Email already exists');
      }
      throw error;
    }
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Errors.VALIDATION_ERROR('Email and password required');
    }

    const result = await query(
      `SELECT id, email, encrypted_password FROM auth.users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Generate JWT token - use number for expiresIn (seconds)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: 3600 } // 1 hour in seconds
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: 2592000 } // 30 days in seconds
    );

    // Log audit event
    await logAuditEvent(user.id, 'auth', user.id, 'login');

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: { id: user.id, email: user.email },
    });
  })
);

// Logout
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      throw Errors.UNAUTHORIZED;
    }

    // Log audit event
    await logAuditEvent(userId, 'auth', userId, 'logout');

    res.json({ message: 'Logout successful' });
  })
);

// Refresh token
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw Errors.VALIDATION_ERROR('Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const userId = (decoded as any).userId;

      const userResult = await query(
        'SELECT id, email FROM auth.users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw Errors.UNAUTHORIZED;
      }

      const user = userResult.rows[0];

      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: 3600 } // 1 hour in seconds
      );

      res.json({ message: 'Token refreshed', token: newToken });
    } catch (error) {
      throw Errors.UNAUTHORIZED;
    }
  })
);

// ============================================================================
// OAUTH REDIRECT ROUTES (RESTORED)
// ============================================================================

// Google OAuth
router.get('/google', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    res.status(500).json({ error: 'Google Client ID not configured' });
    return;
  }

  // Determine redirect URI based on origin
  const origin = _req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectUri = `${origin}/auth/callback`;
  const scope = 'openid profile email';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  
  res.redirect(authUrl);
});

// Microsoft OAuth
router.get('/microsoft', (_req: Request, res: Response) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  
  if (!clientId) {
    res.status(500).json({ error: 'Microsoft Client ID not configured' });
    return;
  }

  // Determine redirect URI based on origin
  const origin = _req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectUri = `${origin}/auth/callback`;
  const scope = 'openid profile email';

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  
  res.redirect(authUrl);
});

// OAuth Callback Handler
router.get('/callback', (_req: Request, res: Response) => {
  const { code, error } = _req.query;

  if (error) {
    res.status(400).json({ error: 'OAuth error', details: error });
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  // TODO: Exchange code for token with OAuth provider
  // This will be handled by the frontend or a separate service
  
  res.json({ 
    message: 'Authorization code received',
    code,
    next: 'Exchange this code for a token'
  });
});

export default router;