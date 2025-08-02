import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      throw new AppError(error.errors[0].message, 400);
    }
  };
};