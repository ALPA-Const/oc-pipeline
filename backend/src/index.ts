// 1) LOAD ENVIRONMENT VARIABLES FIRST - BEFORE ANYTHING ELSE
// This import MUST be first - it loads dotenv.config() before any other modules
import './config/loadEnv';

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

// ISDC Module Routes
import submittalRoutes from './routes/submittals';
import specificationRoutes from './routes/specifications';
import closeoutRoutes from './routes/closeout';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration - Enhanced for Vercel deployments
const allowedOrigins = [
  'https://ocpipeline.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Add environment variable origins if provided
if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin matches Vercel preview deployments pattern
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }

      // Reject other origins
      console.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoints (both /health and /api/health for compatibility)
const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ISDC Module Routes
app.use('/api/submittals', submittalRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/closeout', closeoutRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OC Pipeline Backend API',
    version: '1.0.0',
    modules: {
      core: ['auth', 'projects', 'action-items', 'events', 'dashboard'],
      isdc: ['submittals', 'specifications', 'closeout'],
    },
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('🚀 Server running on port ' + PORT);
  console.log('🔐 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('✅ Health check: http://localhost:' + PORT + '/health');
  console.log('✅ ISDC Module: Loaded (submittals, specifications, closeout)');
  console.log('🔓 CORS enabled for:', allowedOrigins);
});

export default app;