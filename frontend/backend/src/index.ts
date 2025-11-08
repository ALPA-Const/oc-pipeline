import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import projectsRoutes from './routes/projectsRoutes';
import actionItemsRoutes from './routes/actionItemsRoutes';
import eventsRoutes from './routes/eventsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://ocpipeline.vercel.app',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Google OAuth Login Route
app.get('/auth/google', (req: Request, res: Response) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
  }).toString()}`;

  res.redirect(googleAuthUrl);
});

// OAuth Callback Route (handles both Google and Microsoft)
app.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
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

    // For now, return success message
    // In production, you would:
    // 1. Exchange code for tokens
    // 2. Get user info from provider
    // 3. Create/update user in database
    // 4. Generate JWT token
    // 5. Redirect to frontend with token

    res.json({
      success: true,
      message: 'OAuth callback received',
      code: code,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'Callback Processing Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Microsoft OAuth Login Route
app.get('/auth/microsoft', (req: Request, res: Response) => {
  const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    response_mode: 'query',
  }).toString()}`;

  res.redirect(microsoftAuthUrl);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler - for any undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use(errorHandler);

// Start server - FIXED: Bind to 0.0.0.0 for Render deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 OAuth routes enabled: /auth/google, /auth/microsoft, /auth/callback`);
});

export default app;
