import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { CreateUserSchema, UpdateUserSchema } from '../types/auth.type';
import { AppError } from '../middleware/errorHandler';

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    CreateUserSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Invalid input data', 400);
  }
};

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    UpdateUserSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Invalid input data', 400);
  }
};