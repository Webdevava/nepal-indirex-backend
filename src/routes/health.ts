import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';

const router = Router();

router.get('/', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    }
  });
});

export default router;
