import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { connectDatabase } from '../config/database';

async function seed() {
  try {
    await connectDatabase();
    await AuthService.createInitialAdmin();
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seed();