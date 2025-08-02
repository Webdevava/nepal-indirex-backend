import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthResponse, CreateUser, UpdateUser } from '../types/auth.type';
import { AppError } from '../middleware/errorHandler';
// import { logger } from '../utils/logger';

export class AuthController {
  static async createUser(req: Request, res: Response<AuthResponse>) {
    const userData: CreateUser = req.body;
    const creatorId = req.user?.id;
    
    if (userData.role === 'ADMIN' && req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can create admin users', 403);
    }

    const user = await AuthService.createUser(userData, creatorId);
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  }

  static async updateUser(req: Request, res: Response<AuthResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can update users', 403);
    }

    const userIdParam = req.params.id;
    if (!userIdParam) {
      throw new AppError('User ID is required', 400);
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const userData: UpdateUser = req.body;
    const user = await AuthService.updateUser(userId, userData);
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  }

  static async deleteUser(req: Request, res: Response<AuthResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can delete users', 403);
    }

    const userIdParam = req.params.id;
    if (!userIdParam) {
      throw new AppError('User ID is required', 400);
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    await AuthService.deleteUser(userId);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  }

  static async getAllUsers(req: Request, res: Response<AuthResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can view all users', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const result = await AuthService.getAllUsers({ page, limit, role, search });
    
    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result,
    });
  }

  static async getUserById(req: Request, res: Response<AuthResponse>) {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can view user details', 403);
    }

    const userIdParam = req.params.id;
    if (!userIdParam) {
      throw new AppError('User ID is required', 400);
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await AuthService.getUserById(userId);
    
    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: { user },
    });
  }

  static async login(req: Request, res: Response<AuthResponse>) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const { user, token } = await AuthService.login(email, password);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  }
}