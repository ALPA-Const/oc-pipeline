import express, { Router, Request, Response } from 'express';
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
router.get('/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.FRONTEND_URL}/auth/callback`;
  const scope = 'openid profile email';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

router.get('/microsoft', (req: Request, res: Response) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${process.env.FRONTEND_URL}/auth/callback`;
  const scope = 'openid profile email';
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

router.get('/callback', (req: Request, res: Response) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  res.json({
    success: true,
    message: 'OAuth callback received',
    code,
    timestamp: new Date().toISOString()
  });
});

export default router;
