import { z } from 'zod';
import { LabelSchema } from './label.type';

export const ReportOptionsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  date: z.date().optional(),
  deviceId: z.string().optional(),
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo', 'sports']).optional(),
  createdBy: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ReportOptions = z.infer<typeof ReportOptionsSchema>;

export const UserLabelingReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo', 'sports']).nullable(),
  deviceIds: z.array(z.string()),
  createdAt: z.date(),
});

export type UserLabelingReport = z.infer<typeof UserLabelingReportSchema>;

export const ContentLabelingReportSchema = z.object({
  deviceId: z.string(),
  labeledCount: z.number(),
  unlabeledCount: z.number(),
  totalEvents: z.number(),
});

export type ContentLabelingReport = z.infer<typeof ContentLabelingReportSchema>;

export const EmployeePerformanceReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  labels: z.array(LabelSchema),
});

export type EmployeePerformanceReport = z.infer<typeof EmployeePerformanceReportSchema>;

export const LabelTypeDistributionReportSchema = z.object({
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo', 'sports']),
  count: z.number(),
  percentage: z.number(),
});

export type LabelTypeDistributionReport = z.infer<typeof LabelTypeDistributionReportSchema>;

export const DeviceActivitySummaryReportSchema = z.object({
  deviceId: z.string(),
  totalEvents: z.number(),
  labeledEvents: z.number(),
  unlabeledEvents: z.number(),
  labelTypes: z.array(
    z.object({
      labelType: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo', 'sports']),
      count: z.number(),
    })
  ),
});

export type DeviceActivitySummaryReport = z.infer<typeof DeviceActivitySummaryReportSchema>;

export const LabelingEfficiencyReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  averageLabelingTimeSeconds: z.number().nullable(),
  totalLabelingTimeSeconds: z.number().nullable(),
});

export type LabelingEfficiencyReport = z.infer<typeof LabelingEfficiencyReportSchema>;

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface ReportResponse<T> extends BaseResponse {
  data: {
    report: T[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}