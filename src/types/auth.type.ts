import { z } from 'zod';

export const UserRole = z.enum(['ADMIN', 'ANNOTATOR']);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRole,
  recorderId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.number().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: UserRole,
  recorderId: z.string().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

// Option 1: Use a custom type that works with exactOptionalPropertyTypes
export type UpdateUser = {
  name?: string;
  email?: string;
  password?: string;
  recorderId?: string;
};

// Option 2: Alternative Zod schema that creates the correct type
export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  recorderId: z.string(),
}).partial();

// If you want to use the Zod schema for validation, you can still do so:
export const UpdateUserValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  recorderId: z.string().optional(),
});

// Pagination result interface
export interface GetUsersResult {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Base response interface
export interface BaseResponse {
  success: boolean;
  message: string;
}

// Specific response interfaces
export interface LoginResponse extends BaseResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface UserResponse extends BaseResponse {
  data: {
    user: User;
  };
}

export interface UsersListResponse extends BaseResponse {
  data: GetUsersResult;
}

export interface DeleteUserResponse extends BaseResponse {
  data?: never; // No data for delete operations
}

// Generic response type that can handle all cases
export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Alternatively, you can use a union type for more strict typing
export type AuthAPIResponse = 
  | LoginResponse 
  | UserResponse 
  | UsersListResponse 
  | DeleteUserResponse;