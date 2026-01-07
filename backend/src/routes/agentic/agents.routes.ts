import express, { Request, Response } from 'express';

const router = express.Router();

// GET / - List all agents
router.get('/', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agents module not yet implemented' }
  });
});

// GET /:id - Get agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agents module not yet implemented' }
  });
});

// POST / - Create agent
router.post('/', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agents module not yet implemented' }
  });
});

// PUT /:id - Update agent
router.put('/:id', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agents module not yet implemented' }
  });
});

// DELETE /:id - Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agents module not yet implemented' }
  });
});

export default router;
