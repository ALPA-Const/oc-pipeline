/**
 * Cost Codes Routes
 * Manages cost code CRUD and hierarchy
 */
import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import * as costCodeController from '../controllers/costCodeController';

const router = Router();

// GET /api/cost-codes - List cost codes with filtering
router.get('/', authenticate, costCodeController.listCostCodes);

// GET /api/cost-codes/:id - Get single cost code
router.get('/:id', authenticate, costCodeController.getCostCode);

// GET /api/cost-codes/:id/children - Get child cost codes
router.get('/:id/children', authenticate, costCodeController.getCostCodeChildren);

// GET /api/cost-codes/:id/hierarchy - Get full hierarchy path
router.get('/:id/hierarchy', authenticate, costCodeController.getCostCodeHierarchy);

// POST /api/cost-codes - Create cost code
router.post('/', authenticate, requirePermission('cost:write'), costCodeController.createCostCode);

// PUT /api/cost-codes/:id - Update cost code
router.put('/:id', authenticate, requirePermission('cost:write'), costCodeController.updateCostCode);

// DELETE /api/cost-codes/:id - Delete cost code (soft delete)
router.delete('/:id', authenticate, requirePermission('cost:write'), costCodeController.deleteCostCode);

export default router;
