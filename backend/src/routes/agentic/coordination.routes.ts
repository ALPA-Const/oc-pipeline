import express, { Request, Response } from 'express';

const router = express.Router();

// POST /coordinate - Coordinate between agents
router.post('/coordinate', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agent coordination not yet implemented' }
  });
});

// GET /status - Get coordination status
router.get('/status', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Agent coordination not yet implemented' }
  });
});

export default router;
