import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      // Check if it's a ZodError and has issues array
      if (error instanceof ZodError) {
        const firstIssue = error.issues?.[0];
        const message = firstIssue?.message || 'Validation failed';
        throw new AppError(message, 400);
      }
      
      // Fallback for other types of errors
      const message = error?.message || 'Validation failed';
      throw new AppError(message, 400);
    }
  };
};