import { z } from 'zod';
import { LabelSchema } from './label.type';

export const EventSchema = z.object({
  id: z.string(),
  device_id: z.string(),
  timestamp: z.string(),
  type: z.number(),
  image_path: z.string().nullable(),
  max_score: z.number().nullable(),
  created_at: z.date(),
  ads: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      score: z.number().nullable(),
    })
  ),
  channels: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      score: z.number().nullable(),
    })
  ),
  content: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      score: z.number().nullable(),
    })
  ),
  labels: z.array(LabelSchema),
});

export type Event = z.infer<typeof EventSchema>;

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

export interface EventResponse extends BaseResponse {
  data: {
    event: Event;
  };
}

export interface EventsListResponse extends BaseResponse {
  data: GetEventsResult;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}