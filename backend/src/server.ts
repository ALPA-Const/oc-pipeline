import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import memberRoutes from './routes/members';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow multiple origins
const allowedOrigins = [
  'https://ocpipeline.vercel.app',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', memberRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Test database connection
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║  🚀 OC Pipeline API Server Started                ║
╠════════════════════════════════════════════════════╣
║  Port: ${PORT}                                      ║
║  Environment: ${process.env.NODE_ENV || 'development'}                    ║
║  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
║  API: http://localhost:${PORT}                      ║
║  CORS Origins: ${allowedOrigins.length} allowed                  ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;