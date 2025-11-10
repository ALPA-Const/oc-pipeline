// 1) Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// 2) Then import everything else
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import authRoutes from './routes/authRoutes';
import projectsRoutes from './routes/projectsRoutes';
import actionItemsRoutes from './routes/actionItemsRoutes';
import eventsRoutes from './routes/eventsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler /* , notFoundHandler */ } from './middleware/errorHandler';

const app: Application = express();

// Ensure PORT is a number (fixes TS error)
const PORT: number = parseInt(process.env.PORT ?? '', 10) || 4000;

// ───────────────────── Middleware ─────────────────────

// Security headers
app.use(helmet());

// Robust CORS allow-list with fallback
const envOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = envOrigins.length
  ? envOrigins
  : ['https://ocpipeline.vercel.app', 'http://localhost:5173'];

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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined'));

// ───────────────────── Health ─────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ───────────────────── OAuth placeholders ─────────────────────

app.get('/auth/google', (_req: Request, res: Response) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
  }).toString()}`;

  res.redirect(googleAuthUrl);
});

app.get('/auth/microsoft', (_req: Request, res: Response) => {
  const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    response_mode: 'query',
  }).toString()}`;

  res.redirect(microsoftAuthUrl);
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error) {
      return res.status(400).json({ error: 'OAuth Error', message: error });
    }

    if (!code) {
      return res
        .status(400)
        .json({ error: 'Missing Authorization Code', message: 'No authorization code provided' });
    }

    // Placeholder success response
    return res.json({
      success: true,
      message: 'OAuth callback received',
      code,
      state,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('OAuth callback error:', e);
    return res.status(500).json({
      error: 'Callback Processing Error',
      message: e instanceof Error ? e.message : 'Unknown error',
    });
  }
});

// ───────────────────── API routes ─────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Central error handler
app.use(errorHandler);

// ───────────────────── Start server ─────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 OAuth routes: /auth/google, /auth/microsoft, /auth/callback`);
});

export default app;
