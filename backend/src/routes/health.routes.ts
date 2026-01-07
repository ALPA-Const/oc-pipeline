import express, { Request, Response } from 'express';
import { success } from '../utils/response';

const router = express.Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed health check with system info
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };

    success(res, {
      status: 'healthy',
      uptime: `${Math.floor(process.uptime())}s`,
      memory,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
});

export default router;
