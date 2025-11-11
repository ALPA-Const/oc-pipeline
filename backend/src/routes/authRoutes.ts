import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { login, signup, logout, getSession, googleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

// Existing routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', authenticate, logout);
router.get('/session', authenticate, getSession);
router.post('/google', googleAuth);

// OAuth redirect routes
router.get('/google', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  // Determine redirect URI based on origin
  const origin = _req.headers.origin || process.env.FRONTEND_URL;
  const redirectUri = `${origin}/auth/callback`;
  const scope = 'openid profile email';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

router.get('/microsoft', (_req: Request, res: Response) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  
  // Determine redirect URI based on origin
  const origin = _req.headers.origin || process.env.FRONTEND_URL;
  const redirectUri = `${origin}/auth/callback`;
  const scope = 'openid profile email';
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

router.get('/callback', (_req: Request, res: Response) => {
  const { code, error } = _req.query;
  
  if (error) {
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  return res.json({
    success: true,
    message: 'OAuth callback received',
    code,
    timestamp: new Date().toISOString()
  });
});

// OAuth code exchange endpoint
router.post('/api/auth/exchange', async (_req: Request, res: Response) => {
  const { provider, code, redirectUri } = req.body;

  if (!code || !provider) {
    return res.status(400).json({ error: 'Missing code or provider' });
  }

  try {
    let tokenResponse;

    if (provider === 'google') {
      // Exchange code for Google tokens
      tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      });

      const { access_token } = tokenResponse.data;

      // Get user info from Google
      const userResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` }
        }
      );

      const user = userResponse.data;

      // Create your app's JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'google'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      });
    } else if (provider === 'microsoft') {
      // Exchange code for Microsoft tokens
      tokenResponse = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'openid profile email'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const { access_token } = tokenResponse.data;

      // Get user info from Microsoft
      const userResponse = await axios.get(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: { Authorization: `Bearer ${access_token}` }
        }
      );

      const user = userResponse.data;

      // Create your app's JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.mail || user.userPrincipalName,
          name: user.displayName,
          provider: 'microsoft'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.mail || user.userPrincipalName,
          name: user.displayName
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }
  } catch (error: any) {
    console.error('Auth exchange error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message
    });
  }
});

export default router;