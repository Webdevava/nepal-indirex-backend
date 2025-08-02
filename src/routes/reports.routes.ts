import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/user-labeling',
  authenticate,
  authorizeAdmin,
  ReportController.getUserLabelingReport
);
router.get(
  '/content-labeling',
  authenticate,
  authorizeAdmin,
  ReportController.getContentLabelingReport
);
router.get(
  '/employee-performance',
  authenticate,
  authorizeAdmin,
  ReportController.getEmployeePerformanceReport
);
router.get(
  '/label-type-distribution',
  authenticate,
  authorizeAdmin,
  ReportController.getLabelTypeDistributionReport
);
router.get(
  '/device-activity-summary',
  authenticate,
  authorizeAdmin,
  ReportController.getDeviceActivitySummaryReport
);
router.get(
  '/labeling-efficiency',
  authenticate,
  authorizeAdmin,
  ReportController.getLabelingEfficiencyReport
);

export default router;
