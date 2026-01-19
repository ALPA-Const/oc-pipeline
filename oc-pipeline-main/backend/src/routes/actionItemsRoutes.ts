import express, { Router } from 'express';
import { getActionItems, getActionItem, createActionItem, updateActionItem, deleteActionItem } from '../controllers/actionItemsController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', authenticate, getActionItems);
router.get('/:id', authenticate, getActionItem);
router.post('/', authenticate, createActionItem);
router.put('/:id', authenticate, updateActionItem);
router.delete('/:id', authenticate, deleteActionItem);

export default router;
