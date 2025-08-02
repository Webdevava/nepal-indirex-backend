import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { ReportOptionsSchema, ReportResponse } from '../types/report.type';
import { logger } from '../utils/logger';

export class ReportController {
  static async getUserLabelingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        deviceId: req.query.deviceId as string,
        labelType: req.query.labelType as string,
        createdBy: req.query.createdBy as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getUserLabelingReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=user_labeling_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'User labeling report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getUserLabelingReport:', error);
      next(error);
    }
  }

  static async getContentLabelingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        deviceId: req.query.deviceId as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getContentLabelingReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=content_labeling_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'Content labeling report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getContentLabelingReport:', error);
      next(error);
    }
  }

  static async getEmployeePerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        deviceId: req.query.deviceId as string,
        labelType: req.query.labelType as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getEmployeePerformanceReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=employee_performance_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'Employee performance report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getEmployeePerformanceReport:', error);
      next(error);
    }
  }

  static async getLabelTypeDistributionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        deviceId: req.query.deviceId as string,
        createdBy: req.query.createdBy as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getLabelTypeDistributionReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=label_type_distribution_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'Label type distribution report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getLabelTypeDistributionReport:', error);
      next(error);
    }
  }

  static async getDeviceActivitySummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        deviceId: req.query.deviceId as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getDeviceActivitySummaryReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=device_activity_summary_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'Device activity summary report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getDeviceActivitySummaryReport:', error);
      next(error);
    }
  }

  static async getLabelingEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = ReportOptionsSchema.parse({
        ...req.query,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        deviceId: req.query.deviceId as string,
        createdBy: req.query.createdBy as string,
        format: req.query.format as string || 'json',
      });

      const result = await ReportService.getLabelingEfficiencyReport(options);

      if (options.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=labeling_efficiency_report.csv');
        res.send(result.csv);
      } else {
        res.json({
          success: true,
          message: 'Labeling efficiency report fetched successfully',
          data: {
            report: result.report,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
        } as ReportResponse<unknown>);
      }
    } catch (error) {
      logger.error('Error in getLabelingEfficiencyReport:', error);
      next(error);
    }
  }
}