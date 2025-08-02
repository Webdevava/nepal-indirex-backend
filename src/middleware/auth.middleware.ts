import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';
import { User } from '../types/auth.type';

// Extend the global Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// JWT payload interface
interface JWTPayload {
  id: number;
  role: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      throw new AppError('User not found', 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid token', 401);
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
  next();
};