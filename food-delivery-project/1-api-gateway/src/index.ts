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

// Request logging middleware (but skip for proxy routes to avoid double logging)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.url.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  }
  next();
});

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
    timeout: 30000,
    proxyTimeout: 30000,
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
    onError: (err: any, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err);
      if (err.code === 'ECONNRESET' || err.message?.includes('socket hang up')) {
        console.warn(`⚠️ Connection reset for ${serviceName}, ignoring...`);
        return;
      }
      if (!(res as Response).headersSent) {
        (res as Response).status(500).json({
          error: 'Service unavailable',
          message: `Failed to connect to ${serviceName}`,
        });
      }
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
    timeout: 2000, // 2 seconds timeout for faster testing
    proxyTimeout: 2000, // 2 seconds proxy timeout
    xfwd: true,
    secure: false,
    ws: false,
    pathRewrite: {
      '^/api/users/auth/login': '/auth/login',
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
      const startTime = Date.now();
      console.log(`[Proxy] ${new Date().toISOString()} - Forwarding ${req.method} ${req.originalUrl || req.url} to ${services.userService}/auth/login`);
      (req as any).proxyStartTime = startTime;
    },
    onProxyRes: (proxyRes, req, res) => {
      const duration = Date.now() - ((req as any).proxyStartTime || Date.now());
      console.log(`[Proxy] ${new Date().toISOString()} - Response from ${services.userService}: ${proxyRes.statusCode} (${duration}ms)`);
      // Remove connection header that might cause issues
      if (proxyRes.headers) {
        delete proxyRes.headers.connection;
      }
    },
    onError: (err: any, req, res) => {
      const duration = Date.now() - ((req as any).proxyStartTime || Date.now());
      console.error(`[Proxy] ${new Date().toISOString()} - Login proxy error after ${duration}ms:`, err.code || err.message);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Service unavailable. Please check if user service is running.',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Register route - NO body parser before proxy to avoid consuming stream
app.use(
  '/api/users/auth/register',
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    timeout: 2000,
    proxyTimeout: 2000,
    xfwd: true,
    secure: false,
    ws: false,
    pathRewrite: {
      '^/api/users/auth/register': '/auth/register',
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
      const startTime = Date.now();
      console.log(`[Proxy] ${new Date().toISOString()} - Forwarding ${req.method} ${req.originalUrl || req.url} to ${services.userService}/auth/register`);
      (req as any).proxyStartTime = startTime;
    },
    onProxyRes: (proxyRes, req, res) => {
      const duration = Date.now() - ((req as any).proxyStartTime || Date.now());
      console.log(`[Proxy] ${new Date().toISOString()} - Response from ${services.userService}: ${proxyRes.statusCode} (${duration}ms)`);
      if (proxyRes.headers) {
        delete proxyRes.headers.connection;
      }
    },
    onError: (err: any, req, res) => {
      const duration = Date.now() - ((req as any).proxyStartTime || Date.now());
      console.error(`[Proxy] ${new Date().toISOString()} - Register proxy error after ${duration}ms:`, err.code || err.message);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Service unavailable. Please check if user service is running.',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Body parser for non-proxy routes (after proxy routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Restaurant Service - Public routes (get restaurants, get menu)
app.use(
  '/api/restaurants',
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      '^/api/users/profile': '/users/profile',
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
      '^/api/users/addresses': '/users/addresses',
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

// Root endpoint - MUST BE AFTER PROXY ROUTES
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Food Delivery System API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      login: '/api/users/auth/login',
      register: '/api/users/auth/register',
      restaurants: '/api/restaurants',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error stack:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
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
