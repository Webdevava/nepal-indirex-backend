import { prisma } from '../config/database';
import { CreateUser, User } from '../types/auth.type';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { sendInviteEmail } from '../utils/email';
import { Prisma } from '@prisma/client';

interface GetUsersOptions {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

interface GetUsersResult {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class AuthService {
  static async createUser(data: CreateUser, creatorId?: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));

    try {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          recorderId: data.recorderId ?? null, // Explicitly convert undefined to null
          ...(creatorId !== undefined && { createdBy: creatorId }), // Conditionally include createdBy
        },
      });

      if (data.role === 'ANNOTATOR') {
        await sendInviteEmail({
          to: data.email,
          name: data.name,
          password: data.password,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        });
      }

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Email or recorderId already exists', 400);
      }
      throw new AppError('Failed to create user', 500);
    }
  }

  static async updateUser(id: number, data: Partial<CreateUser>): Promise<User> {
    try {
      // Build the update data object conditionally
      const updateData: Prisma.UserUpdateInput = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      if (data.email !== undefined) {
        updateData.email = data.email;
      }
      
      if (data.password !== undefined) {
        updateData.password = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
      }
      
      if (data.recorderId !== undefined) {
        updateData.recorderId = data.recorderId;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Email or recorderId already exists', 400);
      }
      throw new AppError('Failed to update user', 500);
    }
  }

  static async deleteUser(id: number): Promise<void> {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (error) {
      throw new AppError('Failed to delete user', 500);
    }
  }

  static async getAllUsers(options: GetUsersOptions): Promise<GetUsersResult> {
    const { page, limit, role, search } = options;
    const skip = (page - 1) * limit;

    try {
      // Build where clause for filtering
      const whereClause: Prisma.UserWhereInput = {};

      if (role) {
        whereClause.role = role as any; // Assuming role is an enum
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { recorderId: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            recorderId: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
          },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users as User[],
        total,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw new AppError('Failed to fetch users', 500);
    }
  }

  static async getUserById(id: number): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          recorderId: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          // Exclude password from the response
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user as User;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching user by ID:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) { // Fixed: was checking !user instead of !isValidPassword
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });
    return { user, token };
  }

  static async createInitialAdmin() {
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminExists) {
      await this.createUser({
        name: 'Madhu',
        email: 'madhu@sharecast.org.np',
        password: 'madhu@123',
        role: 'ADMIN',
      });
      logger.info('Initial admin created successfully');
    }
  }
}