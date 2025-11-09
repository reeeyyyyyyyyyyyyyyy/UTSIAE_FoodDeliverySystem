import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Service URLs
const services = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  restaurantService: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002',
  orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  driverService: process.env.DRIVER_SERVICE_URL || 'http://localhost:3005',
};

// JWT Authentication Middleware
interface JwtPayload {
  id: number;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      error: 'Invalid or expired token.',
    });
  }
};

// Proxy middleware with JWT forwarding
const createAuthProxy = (serviceUrl: string, serviceName: string) => {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: '',
    },
    onProxyReq: (proxyReq, req) => {
      // Forward JWT token to backend services
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id.toString());
        proxyReq.setHeader('X-User-Email', req.user.email);
        if (req.user.role) {
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      }
      // Forward original authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err);
      (res as Response).status(500).json({
        error: 'Service unavailable',
        message: `Failed to connect to ${serviceName}`,
      });
    },
  });
};

// Public routes (no authentication required)
// User Service - Auth routes (register, login) - MUST BE FIRST AND MOST SPECIFIC
app.use(
  '/api/users/auth/login',
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users/auth/login': '/auth/login',
    },
  })
);

app.use(
  '/api/users/auth/register',
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users/auth/register': '/auth/register',
    },
  })
);

// Restaurant Service - Public routes (get restaurants, get menu)
app.use(
  '/api/restaurants',
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '',
    },
  })
);

// Protected routes (require authentication)
// User Service - Protected routes (profile, addresses)
app.use(
  '/api/users/profile',
  authenticateJWT,
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users/profile': '/profile',
    },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id.toString());
        proxyReq.setHeader('X-User-Email', req.user.email);
        if (req.user.role) {
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
  })
);

app.use(
  '/api/users/addresses',
  authenticateJWT,
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users/addresses': '/addresses',
    },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id.toString());
        proxyReq.setHeader('X-User-Email', req.user.email);
        if (req.user.role) {
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
  })
);

// Order Service - All routes require authentication
app.use('/api/orders', authenticateJWT, createAuthProxy(services.orderService, 'orders'));

// Payment Service - All routes require authentication
app.use('/api/payments', authenticateJWT, createAuthProxy(services.paymentService, 'payments'));

// Driver Service - All routes require authentication
app.use('/api/drivers', authenticateJWT, createAuthProxy(services.driverService, 'drivers'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Food Delivery System API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      userService: '/api/users',
      restaurantService: '/api/restaurants',
      orderService: '/api/orders',
      paymentService: '/api/payments',
      driverService: '/api/drivers',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error stack:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Service URLs:`);
  console.log(`   - User Service: ${services.userService}`);
  console.log(`   - Restaurant Service: ${services.restaurantService}`);
  console.log(`   - Order Service: ${services.orderService}`);
  console.log(`   - Payment Service: ${services.paymentService}`);
  console.log(`   - Driver Service: ${services.driverService}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
