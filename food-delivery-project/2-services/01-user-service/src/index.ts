import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectToDatabase } from './database/connection'; // Fungsi baru yang di-await
import { swaggerSpec } from './config/swagger'; // INI SEKARANG AKAN DITEMUKAN
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email', 'X-User-Role'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'User Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      login: '/auth/login',
      register: '/auth/register',
      profile: '/users/profile/me',
    },
  });
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'User Service' });
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // INI SEKARANG AMAN

// Request logging middleware (before routes)
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} from ${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`);
  // Ensure response headers are set correctly
  res.setHeader('X-Powered-By', 'User-Service');
  // Disable keep-alive to prevent connection issues
  res.setHeader('Connection', 'close');
  next();
});

// ROUTES
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Fungsi Asynchronous untuk memulai server
async function startServer() {
  try {
    // 1. Hubungkan dan inisialisasi database DULU
    await connectToDatabase();

    // 2. SETELAH database siap, baru jalankan server
    app.listen(PORT, () => {
      console.log(`🚀 User Service running on port ${PORT}`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start User Service:', error);
    process.exit(1);
  }
}

// Jalankan server
startServer();