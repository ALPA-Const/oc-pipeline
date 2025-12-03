/**
 * OC Pipeline - API Routes Index
 * Registers all module routes
 */

import { Router } from 'express';

// Import module routes
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import orgRoutes from './orgs.routes';
import projectRoutes from './projects.routes';
import preconRoutes from './precon.routes';
import costRoutes from './cost.routes';
import scheduleRoutes from './schedule.routes';
import riskRoutes from './risk.routes';
import qualityRoutes from './quality.routes';
import safetyRoutes from './safety.routes';
import procurementRoutes from './procurement.routes';
import commsRoutes from './comms.routes';
import staffingRoutes from './staffing.routes';
import closeoutRoutes from './closeout';
import docsRoutes from './docs.routes';
import tasksRoutes from './tasks.routes';
import atlasRoutes from './atlas.routes';
import portfolioRoutes from './portfolio.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API version prefix
const API_PREFIX = '/api/v1';

// Register all routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/orgs`, orgRoutes);
router.use(`${API_PREFIX}/projects`, projectRoutes);
router.use(`${API_PREFIX}/precon`, preconRoutes);
router.use(`${API_PREFIX}/cost`, costRoutes);
router.use(`${API_PREFIX}/schedule`, scheduleRoutes);
router.use(`${API_PREFIX}/risks`, riskRoutes);
router.use(`${API_PREFIX}/quality`, qualityRoutes);
router.use(`${API_PREFIX}/safety`, safetyRoutes);
router.use(`${API_PREFIX}/procurement`, procurementRoutes);
router.use(`${API_PREFIX}/comms`, commsRoutes);
router.use(`${API_PREFIX}/staffing`, staffingRoutes);
router.use(`${API_PREFIX}/closeout`, closeoutRoutes);
router.use(`${API_PREFIX}/docs`, docsRoutes);
router.use(`${API_PREFIX}/tasks`, tasksRoutes);
router.use(`${API_PREFIX}/atlas`, atlasRoutes);
router.use(`${API_PREFIX}/portfolio`, portfolioRoutes);
router.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

export default router;

