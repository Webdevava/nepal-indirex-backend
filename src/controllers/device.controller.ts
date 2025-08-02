import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';
import { AppError } from '../middleware/errorHandler';
import { CreateDevice, DeviceResponse, DevicesListResponse, DeleteDeviceResponse } from '../types/device.type';

export class DeviceController {
  static async registerDevice(req: Request, res: Response<DeviceResponse>) {
    const deviceData: CreateDevice = req.body;

    const device = await DeviceService.registerDevice(deviceData);
    return res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: { device },
    });
  }

  static async updateDevice(req: Request, res: Response<DeviceResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can update devices', 403);
    }

    const deviceId = req.params.id;
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const deviceData: Partial<CreateDevice> = req.body;
    const device = await DeviceService.updateDevice(deviceId, deviceData);

    return res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      data: { device },
    });
  }

  static async deleteDevice(req: Request, res: Response<DeleteDeviceResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can delete devices', 403);
    }

    const deviceId = req.params.id;
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    await DeviceService.deleteDevice(deviceId);

    return res.status(200).json({
      success: true,
      message: 'Device deleted successfully',
    });
  }

  static async getAllDevices(req: Request, res: Response<DevicesListResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can view all devices', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await DeviceService.getAllDevices({ page, limit, isActive });

    return res.status(200).json({
      success: true,
      message: 'Devices fetched successfully',
      data: result,
    });
  }

  static async getDeviceById(req: Request, res: Response<DeviceResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can view device details', 403);
    }

    const deviceId = req.params.id;
    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const device = await DeviceService.getDeviceById(deviceId);

    return res.status(200).json({
      success: true,
      message: 'Device fetched successfully',
      data: { device },
    });
  }
}