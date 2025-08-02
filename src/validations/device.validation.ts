import { z } from 'zod';
import { CreateDeviceSchema, UpdateDeviceSchema } from '../types/device.type';
import { validate } from '../middleware/validate';

export const validateCreateDevice = validate(CreateDeviceSchema);
export const validateUpdateDevice = validate(UpdateDeviceSchema);