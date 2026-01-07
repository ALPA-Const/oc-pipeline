import express, { Request, Response } from 'express';

const router = express.Router();

// GET / - List all agent messages
router.get('/', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agent messages module not yet implemented' }
  });
});

// GET /:id - Get agent message by ID
router.get('/:id', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agent messages module not yet implemented' }
  });
});

// POST / - Create agent message
router.post('/', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agent messages module not yet implemented' }
  });
});

export default router;
