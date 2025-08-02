import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateLabel, Label, UpdateLabel, GetUnlabeledEventsOptions, GetLabelsOptions } from '../types/label.type';
import { logger } from '../utils/logger';

export class LabelService {
  static async createLabel(data: CreateLabel & { created_by: string }): Promise<Label> {
    try {
      const eventIds = data.event_ids.map(id => BigInt(id));
      const events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, timestamp: true, image_path: true },
      });

      if (events.length !== eventIds.length) {
        throw new AppError('One or more events not found', 404);
      }

      const timestamps = events.map(e => Number(e.timestamp));
      const start_time = BigInt(Math.min(...timestamps));
      const end_time = BigInt(Math.max(...timestamps));

      // Sort events by timestamp to get image_paths in order (oldest first)
      const sortedEvents = events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
      const image_paths = sortedEvents.map(e => e.image_path);

      const labelData: Prisma.LabelCreateInput = {
        label_type: data.label_type,
        created_by: data.created_by,
        start_time,
        end_time,
        notes: data.notes,
        events: {
          create: eventIds.map(event_id => ({
            event: { connect: { id: event_id } },
          })),
        },
      };

      if (data.label_type === 'song' && data.song) {
        labelData.song = { create: data.song };
      } else if (data.label_type === 'ad' && data.ad) {
        labelData.ad = { create: data.ad };
      } else if (data.label_type === 'error' && data.error) {
        labelData.error = { create: data.error };
      } else if (data.label_type === 'program' && data.program) {
        labelData.program = { create: data.program };
      }

      const label = await prisma.label.create({
        data: labelData,
        include: {
          events: { include: { event: { select: { id: true, image_path: true, timestamp: true } } } },
          song: true,
          ad: true,
          error: true,
          program: true,
        },
      });

      // Sort image_paths by timestamp
      const sortedImagePaths = label.events
        .sort((a, b) => Number(a.event.timestamp) - Number(b.event.timestamp))
        .map(e => e.event.image_path);

      return {
        id: label.id,
        event_ids: label.events.map(e => e.event_id.toString()),
        label_type: label.label_type as 'song' | 'ad' | 'error' | 'program',
        created_by: label.created_by,
        created_at: label.created_at,
        start_time: label.start_time.toString(),
        end_time: label.end_time.toString(),
        notes: label.notes,
        image_paths: sortedImagePaths,
        song: label.song,
        ad: label.ad,
        error: label.error,
        program: label.program,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Label already exists for one or more events', 400);
      }
      logger.error('Error creating label:', error);
      throw new AppError('Failed to create label', 500);
    }
  }

static async getUnlabeledEvents(options: GetUnlabeledEventsOptions): Promise<{
  events: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const { page, limit, startDate, endDate, deviceId, types, sort } = options;
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.EventWhereInput = {
      labels: { none: {} },
    };

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
        },
      }),
      prisma.event.count({ where: whereClause }),
    ]);

    return {
      events: events.map(event => ({
        ...event,
        id: event.id.toString(),
        timestamp: event.timestamp.toString(),
      })),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    logger.error('Error fetching unlabeled events:', error);
    throw new AppError('Failed to fetch unlabeled events', 500);
  }
}

  static async getLabels(options: GetLabelsOptions): Promise<{
    labels: Label[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { page, limit, startDate, endDate, createdBy, labelType, deviceId, sort } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.LabelWhereInput = {};

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = startDate;
        if (endDate) whereClause.created_at.lte = endDate;
      }

      if (createdBy) {
        whereClause.created_by = createdBy;
      }

      if (labelType) {
        whereClause.label_type = labelType;
      }

      if (deviceId) {
        whereClause.events = { some: { event: { device_id: deviceId } } };
      }

      const [labels, total] = await Promise.all([
        prisma.label.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { created_at: sort || 'desc' },
          include: {
            events: { include: { event: { select: { id: true, image_path: true, timestamp: true } } } },
            song: true,
            ad: true,
            error: true,
            program: true,
          },
        }),
        prisma.label.count({ where: whereClause }),
      ]);

      return {
        labels: labels.map(label => ({
          id: label.id,
          event_ids: label.events.map(e => e.event_id.toString()),
          label_type: label.label_type as 'song' | 'ad' | 'error' | 'program',
          created_by: label.created_by,
          created_at: label.created_at,
          start_time: label.start_time.toString(),
          end_time: label.end_time.toString(),
          notes: label.notes,
          image_paths: label.events
            .sort((a, b) => Number(a.event.timestamp) - Number(b.event.timestamp))
            .map(e => e.event.image_path),
          song: label.song,
          ad: label.ad,
          error: label.error,
          program: label.program,
        })),
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching labels:', error);
      throw new AppError('Failed to fetch labels', 500);
    }
  }

  static async updateLabel(id: number, data: UpdateLabel): Promise<Label> {
    try {
      const updateData: Prisma.LabelUpdateInput = {};

      if (data.label_type !== undefined) {
        updateData.label_type = data.label_type;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      let image_paths: (string | null)[] = [];
      if (data.event_ids !== undefined) {
        const eventIds = data.event_ids.map(id => BigInt(id));
        const events = await prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, image_path: true, timestamp: true },
        });

        if (events.length !== eventIds.length) {
          throw new AppError('One or more events not found', 404);
        }

        // Sort events by timestamp to get image_paths in order
        const sortedEvents = events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        image_paths = sortedEvents.map(e => e.image_path);

        updateData.events = {
          deleteMany: {},
          create: eventIds.map(event_id => ({
            event: { connect: { id: event_id } },
          })),
        };
      }

      if (data.label_type === 'song' && data.song) {
        updateData.song = { upsert: { create: data.song, update: data.song } };
      } else if (data.label_type === 'ad' && data.ad) {
        updateData.ad = { upsert: { create: data.ad, update: data.ad } };
      } else if (data.label_type === 'error' && data.error) {
        updateData.error = { upsert: { create: data.error, update: data.error } };
      } else if (data.label_type === 'program' && data.program) {
        updateData.program = { upsert: { create: data.program, update: data.program } };
      }

      const label = await prisma.label.update({
        where: { id },
        data: updateData,
        include: {
          events: { include: { event: { select: { id: true, image_path: true, timestamp: true } } } },
          song: true,
          ad: true,
          error: true,
          program: true,
        },
      });

      // Use updated image_paths if event_ids were provided, otherwise sort existing ones
      const sortedImagePaths =
        data.event_ids !== undefined
          ? image_paths
          : label.events
              .sort((a, b) => Number(a.event.timestamp) - Number(b.event.timestamp))
              .map(e => e.event.image_path);

      return {
        id: label.id,
        event_ids: label.events.map(e => e.event_id.toString()),
        label_type: label.label_type as 'song' | 'ad' | 'error' | 'program',
        created_by: label.created_by,
        created_at: label.created_at,
        start_time: label.start_time.toString(),
        end_time: label.end_time.toString(),
        notes: label.notes,
        image_paths: sortedImagePaths,
        song: label.song,
        ad: label.ad,
        error: label.error,
        program: label.program,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Label not found', 404);
      }
      logger.error('Error updating label:', error);
      throw new AppError('Failed to update label', 500);
    }
  }

  static async deleteLabel(id: number): Promise<void> {
    try {
      await prisma.label.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Label not found', 404);
      }
      logger.error('Error deleting label:', error);
      throw new AppError('Failed to delete label', 500);
    }
  }

  static async deleteLabelsBulk(labelIds: number[]): Promise<void> {
    try {
      await prisma.label.deleteMany({
        where: { id: { in: labelIds } },
      });
    } catch (error) {
      logger.error('Error deleting labels:', error);
      throw new AppError('Failed to delete labels', 500);
    }
  }
}