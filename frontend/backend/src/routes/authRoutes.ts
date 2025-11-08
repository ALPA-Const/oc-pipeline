import express, { Router } from 'express';
import { login, signup, logout, getSession, googleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', authenticate, logout);
router.get('/session', authenticate, getSession);
router.post('/google', googleAuth);

// OAuth Routes
router.get('/google', (req, res) => {
  try {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
    }).toString()}`;
    res.redirect(googleAuthUrl);
  } catch (error) {
    res.status(500).json({
      error: 'Google OAuth Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/microsoft', (req, res) => {
  try {
    const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      response_mode: 'query',
    }).toString()}`;
    res.redirect(microsoftAuthUrl);
  } catch (error) {
    res.status(500).json({
      error: 'Microsoft OAuth Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/callback', (req, res) => {
  try {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error) {
      return res.status(400).json({
        error: 'OAuth Error',
        message: error,
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Missing Authorization Code',
        message: 'No authorization code provided',
      });
    }

    res.json({
      success: true,
      message: 'OAuth callback received',
      code: code,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Callback Processing Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
