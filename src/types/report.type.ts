import { z } from 'zod';
import { LabelSchema } from './label.type'; // Ensure this is the correct path to your LabelSchema

// Schema for ReportOptions
export const ReportOptionsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  date: z.date().optional(),
  deviceId: z.string().optional(),
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie']).optional(), // Added 'movie'
  createdBy: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type for ReportOptions
export type ReportOptions = z.infer<typeof ReportOptionsSchema>;

// Schema for UserLabelingReport
export const UserLabelingReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie']).nullable(), // Added 'movie'
  deviceIds: z.array(z.string()),
  createdAt: z.date(),
});

// Type for UserLabelingReport
export type UserLabelingReport = z.infer<typeof UserLabelingReportSchema>;

// Schema for ContentLabelingReport
export const ContentLabelingReportSchema = z.object({
  deviceId: z.string(),
  labeledCount: z.number(),
  unlabeledCount: z.number(),
  totalEvents: z.number(),
});

// Type for ContentLabelingReport
export type ContentLabelingReport = z.infer<typeof ContentLabelingReportSchema>;

// Schema for EmployeePerformanceReport
export const EmployeePerformanceReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  labels: z.array(LabelSchema),
});

// Type for EmployeePerformanceReport
export type EmployeePerformanceReport = z.infer<typeof EmployeePerformanceReportSchema>;

// Schema for LabelTypeDistributionReport
export const LabelTypeDistributionReportSchema = z.object({
  labelType: z.enum(['song', 'ad', 'error', 'program', 'movie']), // Added 'movie'
  count: z.number(),
  percentage: z.number(),
});

// Type for LabelTypeDistributionReport
export type LabelTypeDistributionReport = z.infer<typeof LabelTypeDistributionReportSchema>;

// Schema for DeviceActivitySummaryReport
export const DeviceActivitySummaryReportSchema = z.object({
  deviceId: z.string(),
  totalEvents: z.number(),
  labeledEvents: z.number(),
  unlabeledEvents: z.number(),
  labelTypes: z.array(
    z.object({
      labelType: z.enum(['song', 'ad', 'error', 'program', 'movie']), // Added 'movie'
      count: z.number(),
    })
  ),
});

// Type for DeviceActivitySummaryReport
export type DeviceActivitySummaryReport = z.infer<typeof DeviceActivitySummaryReportSchema>;

// Schema for LabelingEfficiencyReport
export const LabelingEfficiencyReportSchema = z.object({
  user: z.string(),
  labelCount: z.number(),
  averageLabelingTimeSeconds: z.number().nullable(),
  totalLabelingTimeSeconds: z.number().nullable(),
});

// Type for LabelingEfficiencyReport
export type LabelingEfficiencyReport = z.infer<typeof LabelingEfficiencyReportSchema>;

// Interface for BaseResponse
export interface BaseResponse {
  success: boolean;
  message: string;
}

// Interface for ReportResponse
export interface ReportResponse<T> extends BaseResponse {
  data: {
    report: T[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}