/**
 * Admin Routes Index
 * Combines all admin sub-routes
 */
import { Router } from 'express';
import auditRoutes from './audit.routes';
import organizationsRoutes from './organizations.routes';
import permissionsRoutes from './permissions.routes';
import rolesRoutes from './roles.routes';
import settingsRoutes from './settings.routes';
import usersRoutes from './users.routes';

const router = Router();

// Mount admin sub-routes
router.use('/audit', auditRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/roles', rolesRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', usersRoutes);

export default router;
