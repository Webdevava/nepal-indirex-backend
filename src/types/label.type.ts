import { z } from 'zod';

export const LabelSongSchema = z.object({
  label_id: z.number().optional(),
  song_name: z.string().min(1, 'Song name is required'),
  artist: z.string().nullable(),
  album: z.string().nullable(),
  language: z.string().nullable(),
  release_year: z.number().int().positive().nullable(),
});

export type LabelSong = z.infer<typeof LabelSongSchema>;

export const LabelAdSchema = z.object({
  label_id: z.number().optional(),
  type: z.enum(['COMMERCIAL_BREAK', 'SPOT_OUTSIDE_BREAK']),
  brand: z.string().min(1, 'Brand is required'),
  product: z.string().nullable(),
  category: z.string().nullable(),
  sector: z.string().nullable(),
  format: z.string().nullable(),
});

export type LabelAd = z.infer<typeof LabelAdSchema>;

export const LabelPromoSchema = z.object({
  label_id: z.number().optional(),
  promo_type: z.enum(['TRAILER', 'ANNOUNCEMENT', 'TEASER', 'PROMO_SPOT']),
  program_name: z.string().nullable(),
  movie_name: z.string().nullable(),
  event_name: z.string().nullable(),
});

export type LabelPromo = z.infer<typeof LabelPromoSchema>;

export const LabelErrorSchema = z.object({
  label_id: z.number().optional(),
  error_type: z.string().min(1, 'Error type is required'),
});

export type LabelError = z.infer<typeof LabelErrorSchema>;

export const LabelProgramSchema = z.object({
  label_id: z.number().optional(),
  program_name: z.string().min(1, 'Program name is required'),
  genre: z.string().nullable(),
  episode_number: z.number().int().positive().nullable(),
  season_number: z.number().int().positive().nullable(),
  language: z.string().nullable(),
});

export type LabelProgram = z.infer<typeof LabelProgramSchema>;

export const LabelMovieSchema = z.object({
  label_id: z.number().optional(),
  movie_name: z.string().min(1, 'Movie name is required'),
  genre: z.string().nullable(),
  director: z.string().nullable(),
  release_year: z.number().int().positive().nullable(),
  language: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
  rating: z.string().nullable(),
});

export type LabelMovie = z.infer<typeof LabelMovieSchema>;

export const LabelSchema = z.object({
  id: z.number(),
  event_ids: z.array(z.string()),
  label_type: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo']),
  created_by: z.string(),
  created_at: z.date(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullable(),
  image_paths: z.array(z.string().nullable()),
  song: LabelSongSchema.nullable(),
  ad: LabelAdSchema.nullable(),
  error: LabelErrorSchema.nullable(),
  program: LabelProgramSchema.nullable(),
  movie: LabelMovieSchema.nullable(),
  promo: LabelPromoSchema.nullable(),
});

export type Label = z.infer<typeof LabelSchema>;

export const CreateLabelSchema = z.object({
  event_ids: z.array(z.string()).min(1, 'At least one event ID is required'),
  label_type: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo']),
  notes: z.string().nullable().optional(),
  song: LabelSongSchema.optional(),
  ad: LabelAdSchema.optional(),
  error: LabelErrorSchema.optional(),
  program: LabelProgramSchema.optional(),
  movie: LabelMovieSchema.optional(),
  promo: LabelPromoSchema.optional(),
}).refine(
  data => {
    if (data.label_type === 'song' && !data.song) return false;
    if (data.label_type === 'ad' && !data.ad) return false;
    if (data.label_type === 'error' && !data.error) return false;
    if (data.label_type === 'program' && !data.program) return false;
    if (data.label_type === 'movie' && !data.movie) return false;
    if (data.label_type === 'promo' && !data.promo) return false;
    if (data.label_type === 'song' && (data.ad || data.error || data.program || data.movie || data.promo)) return false;
    if (data.label_type === 'ad' && (data.song || data.error || data.program || data.movie || data.promo)) return false;
    if (data.label_type === 'error' && (data.song || data.ad || data.program || data.movie || data.promo)) return false;
    if (data.label_type === 'program' && (data.song || data.ad || data.error || data.movie || data.promo)) return false;
    if (data.label_type === 'movie' && (data.song || data.ad || data.error || data.program || data.promo)) return false;
    if (data.label_type === 'promo' && (data.song || data.ad || data.error || data.program || data.movie)) return false;
    return true;
  },
  {
    message: 'Corresponding label details are required, and only one label type should be provided',
    path: ['label_type'],
  }
);

export type CreateLabel = z.infer<typeof CreateLabelSchema>;

export const UpdateLabelSchema = z.object({
  label_type: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo']).optional(),
  notes: z.string().nullable().optional(),
  event_ids: z.array(z.string()).optional(),
  song: LabelSongSchema.optional(),
  ad: LabelAdSchema.optional(),
  error: LabelErrorSchema.optional(),
  program: LabelProgramSchema.optional(),
  movie: LabelMovieSchema.optional(),
  promo: LabelPromoSchema.optional(),
}).refine(
  data => {
    if (data.label_type && data.label_type === 'song' && !data.song) return false;
    if (data.label_type && data.label_type === 'ad' && !data.ad) return false;
    if (data.label_type && data.label_type === 'error' && !data.error) return false;
    if (data.label_type && data.label_type === 'program' && !data.program) return false;
    if (data.label_type && data.label_type === 'movie' && !data.movie) return false;
    if (data.label_type && data.label_type === 'promo' && !data.promo) return false;
    if (data.label_type && data.label_type === 'song' && (data.ad || data.error || data.program || data.movie || data.promo)) return false;
    if (data.label_type && data.label_type === 'ad' && (data.song || data.error || data.program || data.movie || data.promo)) return false;
    if (data.label_type && data.label_type === 'error' && (data.song || data.ad || data.program || data.movie || data.promo)) return false;
    if (data.label_type && data.label_type === 'program' && (data.song || data.ad || data.error || data.movie || data.promo)) return false;
    if (data.label_type && data.label_type === 'movie' && (data.song || data.ad || data.error || data.program || data.promo)) return false;
    if (data.label_type && data.label_type === 'promo' && (data.song || data.ad || data.error || data.program || data.movie)) return false;
    return true;
  },
  {
    message: 'Corresponding label details are required, and only one label type should be provided',
    path: ['label_type'],
  }
);

export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;

export interface GetUnlabeledEventsOptions {
  page: number;
  limit: number;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  deviceId?: string | undefined;
  types?: number[] | undefined;
  sort?: 'asc' | 'desc';
}

export interface GetLabelsOptions {
  page: number;
  limit: number;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  createdBy?: string | undefined;
  labelType?: string | undefined;
  deviceId?: string | undefined;
  sort?: 'asc' | 'desc';
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface LabelResponse extends BaseResponse {
  data: {
    label: Label;
  };
}

export interface LabelsListResponse extends BaseResponse {
  data: {
    events?: any[];
    labels?: Label[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export const ProgramGuideLabelSchema = z.object({
  id: z.number(),
  label_type: z.enum(['song', 'ad', 'error', 'program', 'movie', 'promo']),
  created_by: z.string(),
  created_at: z.date(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullable(),
  device_id: z.string().nullable(),
  image_paths: z.array(z.string().nullable()),
  song: LabelSongSchema.nullable(),
  ad: LabelAdSchema.nullable(),
  error: LabelErrorSchema.nullable(),
  program: LabelProgramSchema.nullable(),
  movie: LabelMovieSchema.nullable(),
  promo: LabelPromoSchema.nullable(),
});

export type ProgramGuideLabel = z.infer<typeof ProgramGuideLabelSchema>;

export interface ProgramGuideResponse extends BaseResponse {
  data: {
    date: string;
    labels: ProgramGuideLabel[];
  };
}