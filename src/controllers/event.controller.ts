import { Request, Response } from 'express';
import { EventService } from '../services/event.service';
import { AppError } from '../middleware/errorHandler';
import { EventResponse, EventsListResponse, GetEventsOptions } from '../types/event.type';

export class EventController {
  static async getEvents(req: Request, res: Response<EventsListResponse>) {
    const options: GetEventsOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      deviceId: req.query.deviceId as string | undefined,
      types: req.query.types ? (req.query.types as string).split(',').map(Number).filter(n => !isNaN(n)) : undefined,
      sort: (req.query.sort as 'asc' | 'desc') || 'desc',
      category: req.query.category as 'ads' | 'channels' | 'content' | undefined,
    };

    if (options.startDate && isNaN(options.startDate.getTime())) {
      throw new AppError('Invalid start date', 400);
    }
    if (options.endDate && isNaN(options.endDate.getTime())) {
      throw new AppError('Invalid end date', 400);
    }

    const result = await EventService.getEvents(options);

    return res.status(200).json({
      success: true,
      message: 'Events fetched successfully',
      data: result,
    });
  }

  static async getEventById(req: Request, res: Response<EventResponse>) {
    const eventIdParam = req.params.id;
    if (!eventIdParam) {
      throw new AppError('Event ID is required', 400);
    }

    try {
      const eventId = BigInt(eventIdParam);
      const event = await EventService.getEventById(eventId);

      return res.status(200).json({
        success: true,
        message: 'Event fetched successfully',
        data: { event },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError') {
        throw new AppError('Invalid event ID format', 400);
      }
      throw error;
    }
  }
}