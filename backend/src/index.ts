// 1) LOAD ENVIRONMENT VARIABLES FIRST - BEFORE ANYTHING ELSE
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
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/action-items', actionItemsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('Health check: http://localhost:' + PORT + '/health');
});

export default app;

