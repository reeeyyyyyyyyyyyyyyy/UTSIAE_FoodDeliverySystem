import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectToDatabase } from './database/connection'; // Fungsi baru yang di-await
import { swaggerSpec } from './config/swagger'; // INI SEKARANG AKAN DITEMUKAN
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'Payment Service' });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Payment Service is running',
    service: 'Payment Service',
    version: '1.0.0'
  });
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // INI SEKARANG AMAN

// ROUTES
app.use('/payments', paymentRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3004;

// Fungsi Asynchronous untuk memulai server
async function startServer() {
  try {
    // 1. Hubungkan dan inisialisasi database DULU
    await connectToDatabase();

    // 2. SETELAH database siap, baru jalankan server
    app.listen(PORT, () => {
      console.log(`🚀 Payment Service running on port ${PORT}`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Payment Service:', error);
    process.exit(1);
  }
}

// Jalankan server
startServer();