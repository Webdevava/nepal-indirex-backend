import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { validateCreateDevice, validateUpdateDevice } from '../validations/device.validation';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authenticate, authorizeAdmin, validateCreateDevice, DeviceController.registerDevice);
router.get('/', authenticate, authorizeAdmin, DeviceController.getAllDevices);
router.get('/:id', authenticate, authorizeAdmin, DeviceController.getDeviceById);
router.put('/:id', authenticate, authorizeAdmin, validateUpdateDevice, DeviceController.updateDevice);
router.delete('/:id', authenticate, authorizeAdmin, DeviceController.deleteDevice);

export default router;