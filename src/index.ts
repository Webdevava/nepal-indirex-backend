import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Global BigInt serialization - Add this here
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use(process.env.API_PREFIX || '/api/v1', apiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Database Connection Success`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((err) => {
  console.error('❌ Server failed to start due to DB connection issue:', err);
  process.exit(1);
});

export default app;