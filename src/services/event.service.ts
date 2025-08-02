import { prisma } from '../config/database';
import { Event } from '../types/event.type';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface GetEventsOptions {
  page: number;
  limit: number;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  deviceId?: string | undefined;
  types?: number[] | undefined;
  sort?: 'asc' | 'desc';
}

export interface GetEventsResult {
  events: Event[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Enhanced helper function to convert BigInt fields to strings recursively
const serializeEvent = (event: any): Event => {
  const serialized = {
    ...event,
    id: event.id.toString(),
    timestamp: event.timestamp.toString(),
    ads: event.ads?.map((ad: any) => ({
      ...ad,
      event_id: ad.event_id?.toString(),
    })) || [],
    channels: event.channels?.map((channel: any) => ({
      ...channel,
      event_id: channel.event_id?.toString(),
    })) || [],
    content: event.content?.map((content: any) => ({
      ...content,
      event_id: content.event_id?.toString(),
    })) || [],
    labels: event.labels?.map((labelEvent: any) => ({
      ...labelEvent.label,
      id: labelEvent.label.id,
      event_ids: labelEvent.label.events.map((e: any) => e.event_id.toString()),
      label_type: labelEvent.label.label_type,
      created_by: labelEvent.label.created_by,
      created_at: labelEvent.label.created_at,
      start_time: labelEvent.label.start_time.toString(),
      end_time: labelEvent.label.end_time.toString(),
      notes: labelEvent.label.notes,
      image_paths: labelEvent.label.events
        .sort((a: any, b: any) => Number(a.event.timestamp) - Number(b.event.timestamp))
        .map((e: any) => e.event.image_path),
      song: labelEvent.label.song,
      ad: labelEvent.label.ad,
      error: labelEvent.label.error,
      program: labelEvent.label.program,
    })) || [],
  };

  return serialized;
};

export class EventService {
  static async getEvents(options: GetEventsOptions): Promise<GetEventsResult> {
    const { page, limit, startDate, endDate, deviceId, types, sort } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.EventWhereInput = {};

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = BigInt(Math.floor(startDate.getTime() / 1000)); // Convert ms to seconds
        if (endDate) whereClause.timestamp.lte = BigInt(Math.floor(endDate.getTime() / 1000)); // Convert ms to seconds
      }

      if (deviceId) {
        whereClause.device_id = deviceId;
      }

      if (types && types.length > 0) {
        whereClause.type = { in: types };
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { timestamp: sort || 'desc' },
          include: {
            ads: true,
            channels: true,
            content: true,
            labels: {
              include: {
                label: {
                  include: {
                    song: true,
                    ad: true,
                    error: true,
                    program: true,
                    events: { include: { event: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.event.count({ where: whereClause }),
      ]);

      // Properly serialize all events
      const serializedEvents = events.map(event => serializeEvent(event));

      return {
        events: serializedEvents as Event[],
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw new AppError('Failed to fetch events', 500);
    }
  }

  static async getEventById(id: bigint): Promise<Event> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          ads: true,
          channels: true,
          content: true,
          labels: {
            include: {
              label: {
                include: {
                  song: true,
                  ad: true,
                  error: true,
                  program: true,
                  events: { include: { event: true } },
                },
              },
            },
          },
        },
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      return serializeEvent(event) as Event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching event by ID:', error);
      throw new AppError('Failed to fetch event', 500);
    }
  }
}