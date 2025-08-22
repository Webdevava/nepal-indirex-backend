import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { Parser } from 'json2csv';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  ReportOptions,
  UserLabelingReport,
  ContentLabelingReport,
  EmployeePerformanceReport,
  LabelTypeDistributionReport,
  DeviceActivitySummaryReport,
  LabelingEfficiencyReport,
} from '../types/report.type';
import { Label } from '../types/label.type';

export class ReportService {
  static async getUserLabelingReport(options: ReportOptions): Promise<{
    report: UserLabelingReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, startDate, endDate, deviceId, labelType, createdBy, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.LabelWhereInput = {};
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }
      if (deviceId) whereClause.events = { some: { event: { device_id: deviceId } } };
      if (labelType) whereClause.label_type = labelType;
      if (createdBy) whereClause.created_by = createdBy;

      const labels = await prisma.label.groupBy({
        by: ['created_by', 'label_type', 'created_at'],
        where: whereClause,
        _count: { id: true },
        orderBy: { created_at: options.sort || 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.label.count({ where: whereClause });

      const report: UserLabelingReport[] = await Promise.all(
        labels.map(async (label) => {
          const deviceIds = await prisma.labelEvent
            .findMany({
              where: { label_id: { in: await prisma.label.findMany({ where: { created_by: label.created_by, label_type: label.label_type, created_at: label.created_at } }).then(ls => ls.map(l => l.id)) } },
              select: { event: { select: { device_id: true } } },
            })
            .then(events => [...new Set(events.map(e => e.event.device_id))]);
          
          return {
            user: label.created_by,
            labelCount: label._count.id,
            labelType: label.label_type as 'song' | 'ad' | 'error' | 'program' | 'movie' | null,
            deviceIds,
            createdAt: label.created_at,
          };
        })
      );

      if (format === 'csv') {
        const fields = ['user', 'labelCount', 'labelType', 'deviceIds', 'createdAt'];
        const parser = new Parser({ fields });
        const csv = parser.parse(report);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching user labeling report:', error);
      throw new AppError('Failed to fetch user labeling report', 500);
    }
  }

  static async getContentLabelingReport(options: ReportOptions): Promise<{
    report: ContentLabelingReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, startDate, endDate, deviceId, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.EventWhereInput = {};
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }
      if (deviceId) whereClause.device_id = deviceId;

      const devices = await prisma.event.groupBy({
        by: ['device_id'],
        where: whereClause,
        _count: { id: true },
      });

      const total = devices.length;

      const report: ContentLabelingReport[] = await Promise.all(
        devices.slice(skip, skip + limit).map(async (device) => {
          const labeledCount = await prisma.event.count({
            where: { ...whereClause, device_id: device.device_id, labels: { some: {} } },
          });
          const totalCount = device._count.id;
          return {
            deviceId: device.device_id,
            labeledCount,
            unlabeledCount: totalCount - labeledCount,
            totalEvents: totalCount,
          };
        })
      );

      if (format === 'csv') {
        const fields = ['deviceId', 'labeledCount', 'unlabeledCount', 'totalEvents'];
        const parser = new Parser({ fields });
        const csv = parser.parse(report);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching content labeling report:', error);
      throw new AppError('Failed to fetch content labeling report', 500);
    }
  }

  static async getEmployeePerformanceReport(options: ReportOptions): Promise<{
    report: EmployeePerformanceReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, date, deviceId, labelType, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.LabelWhereInput = {};
      if (date) {
        whereClause.created_at = {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }
      if (deviceId) whereClause.events = { some: { event: { device_id: deviceId } } };
      if (labelType) whereClause.label_type = labelType;

      const labels = await prisma.label.groupBy({
        by: ['created_by'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        skip,
        take: limit,
      });

      const total = (await prisma.label.groupBy({
        by: ['created_by'],
        where: whereClause,
      })).length;

      const report: EmployeePerformanceReport[] = await Promise.all(
        labels.map(async (label) => {
          const userLabels = await prisma.label.findMany({
            where: { created_by: label.created_by, ...whereClause },
            include: {
              events: { include: { event: { select: { id: true, image_path: true, timestamp: true } } } },
              song: true,
              ad: true,
              error: true,
              program: true,
              movie: true, // Added movie include
            },
          });
          return {
            user: label.created_by,
            labelCount: label._count.id,
            labels: userLabels.map(l => ({
              id: l.id,
              event_ids: l.events.map(e => e.event_id.toString()),
              label_type: l.label_type as 'song' | 'ad' | 'error' | 'program' | 'movie', // Added movie type
              created_by: l.created_by,
              created_at: l.created_at,
              start_time: l.start_time.toString(),
              end_time: l.end_time.toString(),
              notes: l.notes,
              image_paths: l.events
                .sort((a, b) => Number(a.event.timestamp) - Number(b.event.timestamp))
                .map(e => e.event.image_path),
              song: l.song,
              ad: l.ad,
              error: l.error,
              program: l.program,
              movie: l.movie, // Added movie field
            })),
          };
        })
      );

      if (format === 'csv') {
        const flatReport = report.flatMap(r =>
          r.labels.map(l => ({
            user: r.user,
            labelCount: r.labelCount,
            labelId: l.id,
            labelType: l.label_type,
            createdAt: l.created_at.toISOString(),
            eventIds: l.event_ids.join(','),
            imagePaths: l.image_paths.join(','),
            notes: l.notes || '',
          }))
        );
        const fields = ['user', 'labelCount', 'labelId', 'labelType', 'createdAt', 'eventIds', 'imagePaths', 'notes'];
        const parser = new Parser({ fields });
        const csv = parser.parse(flatReport);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching employee performance report:', error);
      throw new AppError('Failed to fetch employee performance report', 500);
    }
  }

  static async getLabelTypeDistributionReport(options: ReportOptions): Promise<{
    report: LabelTypeDistributionReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, startDate, endDate, deviceId, createdBy, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.LabelWhereInput = {};
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }
      if (deviceId) whereClause.events = { some: { event: { device_id: deviceId } } };
      if (createdBy) whereClause.created_by = createdBy;

      const totalLabels = await prisma.label.count({ where: whereClause });
      const labels = await prisma.label.groupBy({
        by: ['label_type'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        skip,
        take: limit,
      });

      const report: LabelTypeDistributionReport[] = labels.map(label => ({
        labelType: label.label_type as 'song' | 'ad' | 'error' | 'program' | 'movie', // Added movie type
        count: label._count.id,
        percentage: totalLabels > 0 ? (label._count.id / totalLabels) * 100 : 0,
      }));

      const total = labels.length;

      if (format === 'csv') {
        const fields = ['labelType', 'count', 'percentage'];
        const parser = new Parser({ fields });
        const csv = parser.parse(report);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching label type distribution report:', error);
      throw new AppError('Failed to fetch label type distribution report', 500);
    }
  }

  static async getDeviceActivitySummaryReport(options: ReportOptions): Promise<{
    report: DeviceActivitySummaryReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, startDate, endDate, deviceId, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.EventWhereInput = {};
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }
      if (deviceId) whereClause.device_id = deviceId;

      const devices = await prisma.event.groupBy({
        by: ['device_id'],
        where: whereClause,
        _count: { id: true },
      });

      const total = devices.length;

      const report: DeviceActivitySummaryReport[] = await Promise.all(
        devices.slice(skip, skip + limit).map(async (device) => {
          const labeledEvents = await prisma.event.findMany({
            where: { ...whereClause, device_id: device.device_id, labels: { some: {} } },
            include: { labels: { select: { label: { select: { label_type: true } } } } },
          });

          const labelTypes = await prisma.label.groupBy({
            by: ['label_type'],
            where: { events: { some: { event: { device_id: device.device_id, ...whereClause } } } },
            _count: { id: true },
          });

          return {
            deviceId: device.device_id,
            totalEvents: device._count.id,
            labeledEvents: labeledEvents.length,
            unlabeledEvents: device._count.id - labeledEvents.length,
            labelTypes: labelTypes.map(lt => ({
              labelType: lt.label_type as 'song' | 'ad' | 'error' | 'program' | 'movie', // Added movie type
              count: lt._count.id,
            })),
          };
        })
      );

      if (format === 'csv') {
        const flatReport = report.flatMap(r => ({
          deviceId: r.deviceId,
          totalEvents: r.totalEvents,
          labeledEvents: r.labeledEvents,
          unlabeledEvents: r.unlabeledEvents,
          labelTypes: r.labelTypes.map(lt => `${lt.labelType}:${lt.count}`).join(';'),
        }));
        const fields = ['deviceId', 'totalEvents', 'labeledEvents', 'unlabeledEvents', 'labelTypes'];
        const parser = new Parser({ fields });
        const csv = parser.parse(flatReport);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching device activity summary report:', error);
      throw new AppError('Failed to fetch device activity summary report', 500);
    }
  }

  static async getLabelingEfficiencyReport(options: ReportOptions): Promise<{
    report: LabelingEfficiencyReport[];
    total: number;
    totalPages: number;
    currentPage: number;
    csv?: string;
  }> {
    const { page, limit, startDate, endDate, deviceId, createdBy, format } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.LabelWhereInput = {};
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }
      if (deviceId) whereClause.events = { some: { event: { device_id: deviceId } } };
      if (createdBy) whereClause.created_by = createdBy;

      const labels = await prisma.label.groupBy({
        by: ['created_by'],
        where: whereClause,
        _count: { id: true },
        skip,
        take: limit,
        orderBy: { _count: { id: 'desc' } },
      });

      const total = (await prisma.label.groupBy({
        by: ['created_by'],
        where: whereClause,
      })).length;

      const report: LabelingEfficiencyReport[] = await Promise.all(
        labels.map(async (label) => {
          const userLabels = await prisma.label.findMany({
            where: { created_by: label.created_by, ...whereClause },
            include: { events: { select: { event: { select: { timestamp: true } } } } },
          });

          const labelingTimes = userLabels
            .filter(l => l.events.length > 0)
            .map(l => {
              const eventTimestamp = Math.min(...l.events.map(e => Number(e.event.timestamp)));
              return (l.created_at.getTime() - eventTimestamp) / 1000;
            });

          const totalLabelingTime = labelingTimes.reduce((sum, time) => sum + time, 0);
          const averageLabelingTime = labelingTimes.length > 0 ? totalLabelingTime / labelingTimes.length : null;

          return {
            user: label.created_by,
            labelCount: label._count.id,
            averageLabelingTimeSeconds: averageLabelingTime,
            totalLabelingTimeSeconds: totalLabelingTime || null,
          };
        })
      );

      if (format === 'csv') {
        const fields = ['user', 'labelCount', 'averageLabelingTimeSeconds', 'totalLabelingTimeSeconds'];
        const parser = new Parser({ fields });
        const csv = parser.parse(report);
        return { report, total, totalPages: Math.ceil(total / limit), currentPage: page, csv };
      }

      return {
        report,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching labeling efficiency report:', error);
      throw new AppError('Failed to fetch labeling efficiency report', 500);
    }
  }
}