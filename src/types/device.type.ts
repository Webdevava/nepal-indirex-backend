import { z } from 'zod';

export const DeviceSchema = z.object({
  device_id: z.string().min(1),
  is_active: z.boolean(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const CreateDeviceSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  is_active: z.boolean().optional(),
});

export type CreateDevice = z.infer<typeof CreateDeviceSchema>;

export const UpdateDeviceSchema = z.object({
  is_active: z.boolean().optional(),
});

export type UpdateDevice = z.infer<typeof UpdateDeviceSchema>;

export interface GetDevicesResult {
  devices: Device[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface DeviceResponse extends BaseResponse {
  data: {
    device: Device;
  };
}

export interface DevicesListResponse extends BaseResponse {
  data: GetDevicesResult;
}

export interface DeleteDeviceResponse extends BaseResponse {
  data?: never;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}