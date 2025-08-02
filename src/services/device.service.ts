import { prisma } from '../config/database';
import { CreateDevice, Device } from '../types/device.type';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

interface GetDevicesOptions {
  page: number;
  limit: number;
  isActive?: boolean | undefined;
}

interface GetDevicesResult {
  devices: Device[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class DeviceService {
  static async registerDevice(data: CreateDevice): Promise<Device> {
    try {
      const device = await prisma.device.create({
        data: {
          device_id: data.device_id,
          is_active: data.is_active ?? true,
        },
      });
      return device;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Device ID already exists', 400);
      }
      throw new AppError('Failed to register device', 500);
    }
  }

  static async updateDevice(device_id: string, data: Partial<CreateDevice>): Promise<Device> {
    try {
      const updateData: Prisma.DeviceUpdateInput = {};
      
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }

      const device = await prisma.device.update({
        where: { device_id },
        data: updateData,
      });
      
      return device;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2001') {
        throw new AppError('Device not found', 404);
      }
      throw new AppError('Failed to update device', 500);
    }
  }

  static async deleteDevice(device_id: string): Promise<void> {
    try {
      await prisma.device.delete({ where: { device_id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2001') {
        throw new AppError('Device not found', 404);
      }
      throw new AppError('Failed to delete device', 500);
    }
  }

  static async getAllDevices(options: GetDevicesOptions): Promise<GetDevicesResult> {
    const { page, limit, isActive } = options;
    const skip = (page - 1) * limit;

    try {
      const whereClause: Prisma.DeviceWhereInput = {};
      if (isActive !== undefined) {
        whereClause.is_active = isActive;
      }

      const [devices, total] = await Promise.all([
        prisma.device.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { device_id: 'asc' },
        }),
        prisma.device.count({ where: whereClause }),
      ]);

      return {
        devices: devices as Device[],
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching devices:', error);
      throw new AppError('Failed to fetch devices', 500);
    }
  }

  static async getDeviceById(device_id: string): Promise<Device> {
    try {
      const device = await prisma.device.findUnique({
        where: { device_id },
      });

      if (!device) {
        throw new AppError('Device not found', 404);
      }

      return device as Device;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching device by ID:', error);
      throw new AppError('Failed to fetch device', 500);
    }
  }
}