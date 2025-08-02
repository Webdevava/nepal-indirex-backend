import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health';
import deviceRoutes from './device.routes';
import eventRoutes from './event.routes';
import labelRoutes from './label.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/devices', deviceRoutes);
router.use('/events', eventRoutes);
router.use('/labels', labelRoutes);
router.use('/reports', reportsRoutes);

export default router;