import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateCreateUser, validateUpdateUser } from '../validations/auth.validation';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// Authentication routes
router.post('/login', AuthController.login);

// User management routes (Admin only)
router.post('/register', authenticate, authorizeAdmin, validateCreateUser, AuthController.createUser);
router.get('/users', authenticate, authorizeAdmin, AuthController.getAllUsers);
router.get('/users/:id', authenticate, authorizeAdmin, AuthController.getUserById);
router.put('/users/:id', authenticate, authorizeAdmin, validateUpdateUser, AuthController.updateUser);
router.delete('/users/:id', authenticate, authorizeAdmin, AuthController.deleteUser);

export default router;