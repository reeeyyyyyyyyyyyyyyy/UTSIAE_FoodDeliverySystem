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

// NOTE: Body parser middleware is now applied per-route (before proxy middleware)
// to ensure proper SOA communication - each route that needs body parsing
// will have express.json() middleware before its proxy middleware

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
// IMPORTANT: NO body parser middleware before these routes to avoid consuming request stream
app.use(
  '/api/users/auth/login',
  express.json({ limit: '10mb' }), // Parse JSON body for login
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    timeout: 10000, // 10 seconds timeout
    proxyTimeout: 10000, // 10 seconds proxy timeout
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
      
      // Write JSON body if it exists (already parsed by express.json above)
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        (req as any).bodyParsed = true; // Mark as parsed to avoid duplicate parsing
      }
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

// Register route - Parse JSON body before proxy
app.use(
  '/api/users/auth/register',
  express.json({ limit: '10mb' }), // Parse JSON body for register
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    timeout: 10000, // 10 seconds timeout
    proxyTimeout: 10000, // 10 seconds proxy timeout
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
      
      // Write JSON body if it exists (already parsed by express.json above)
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        (req as any).bodyParsed = true; // Mark as parsed to avoid duplicate parsing
      }
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

// Body parser for non-proxy routes (after proxy routes) - only for non-multipart
// This is for routes that don't use proxy middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip if already parsed (for proxy routes that have their own body parser)
  if ((req as any).bodyParsed) {
    return next();
  }
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if ((req as any).bodyParsed) {
    return next();
  }
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Restaurant Service - Public routes (get restaurants, get menu)
app.get(
  '/api/restaurants',
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.get(
  '/api/restaurants/:id/menu',
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant menu proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Restaurant Service - Admin routes (require authentication and admin role)
// Note: For multipart/form-data, we don't use express.json() middleware
app.post(
  '/api/restaurants',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      // For multipart/form-data, preserve the Content-Type header with boundary
      // Don't modify it - let the original request headers pass through
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant create proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.post(
  '/api/restaurants/:id/menu',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      // For multipart/form-data, preserve the Content-Type header with boundary
      // Don't modify it - let the original request headers pass through
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant menu create proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Restaurant update route
app.put(
  '/api/restaurants/:id',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      // For multipart/form-data, preserve the Content-Type header with boundary
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant update proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Restaurant delete route
app.delete(
  '/api/restaurants/:id',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
    onError: (err: any, req, res) => {
      console.error('Restaurant delete proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Menu item update route
app.put(
  '/api/restaurants/menu-items/:id',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      // For multipart/form-data, preserve the Content-Type header with boundary
    },
    onError: (err: any, req, res) => {
      console.error('Menu item update proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.put(
  '/api/restaurants/menu-items/:id/stock',
  authenticateJWT,
  express.json({ limit: '10mb' }),
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
      // Write body to proxy request if it exists
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err: any, req, res) => {
      console.error('Restaurant stock proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.put(
  '/api/restaurants/menu-items/:id/availability',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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

// Menu item delete route
app.delete(
  '/api/restaurants/menu-items/:id',
  authenticateJWT,
  createProxyMiddleware({
    target: services.restaurantService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/restaurants': '/restaurants',
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
    onError: (err: any, req, res) => {
      console.error('Menu item delete proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Restaurant service unavailable',
          error: err.message || err.code,
        });
      }
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

// User addresses routes - GET and POST
app.get(
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

app.post(
  '/api/users/addresses',
  authenticateJWT,
  express.json({ limit: '10mb' }),
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
      // Write body to proxy request if it exists
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err: any, req, res) => {
      console.error('User addresses POST proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'User service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// User addresses routes - PUT and DELETE
app.put(
  '/api/users/addresses/:id',
  authenticateJWT,
  express.json({ limit: '10mb' }),
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
      // Write body to proxy request if it exists
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err: any, req, res) => {
      console.error('User addresses PUT proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'User service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.delete(
  '/api/users/addresses/:id',
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
    onError: (err: any, req, res) => {
      console.error('User addresses DELETE proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'User service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// User Service - Admin routes
app.get(
  '/api/users/admin/all',
  authenticateJWT,
  createProxyMiddleware({
    target: services.userService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '/users',
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
    onError: (err: any, req, res) => {
      console.error('User admin all proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'User service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Order Service - Customer routes (create order, get orders, get order by id)
app.post(
  '/api/orders',
  authenticateJWT,
  express.json({ limit: '10mb' }), // Parse JSON body for order creation
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    timeout: 30000, // 30 seconds timeout for order creation (needs to call multiple services)
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/orders': '/orders',
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
      
      // Write JSON body if it exists (already parsed by express.json above)
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        (req as any).bodyParsed = true;
      }
    },
    onError: (err: any, req, res) => {
      console.error('Order proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Order service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.get(
  '/api/orders',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

// Order Service - Driver routes (MUST BE BEFORE /api/orders/:id to avoid route conflict)
app.get(
  '/api/orders/available',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.get(
  '/api/orders/driver/my-orders',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

// Order Service - Admin routes
app.get(
  '/api/orders/admin/dashboard/stats',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.get(
  '/api/orders/admin/sales/statistics',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.get(
  '/api/orders/admin/sales/restaurants',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.get(
  '/api/orders/admin/all',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

// Order Service - Get order by ID (MUST BE AFTER specific routes)
app.get(
  '/api/orders/:id',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.post(
  '/api/orders/:id/accept',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

app.post(
  '/api/orders/:id/complete',
  authenticateJWT,
  createProxyMiddleware({
    target: services.orderService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
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

// Payment Service - All routes require authentication
// Payment Service - Simulate payment route (needs body parser)
app.post(
  '/api/payments/simulate',
  authenticateJWT,
  express.json({ limit: '10mb' }),
  createProxyMiddleware({
    target: services.paymentService,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/payments': '/payments', // Keep /payments because routes are mounted at /payments
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
      
      // Write JSON body if it exists
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        (req as any).bodyParsed = true;
      }
    },
    onError: (err: any, req, res) => {
      console.error('Payment proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Payment service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Payment Service - Other routes
// Note: Payment Service routes are mounted at /payments, so we need custom pathRewrite
app.use(
  '/api/payments',
  authenticateJWT,
  createProxyMiddleware({
    target: services.paymentService,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/payments': '/payments', // Keep /payments because routes are mounted at /payments
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
    onError: (err: any, req, res) => {
      console.error('Payment proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Payment service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Driver Service - Admin routes
app.get(
  '/api/drivers/admin/all',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
    },
    timeout: 10000,
    proxyTimeout: 10000,
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
    onError: (err: any, req, res) => {
      console.error('Driver admin all proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Driver service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.get(
  '/api/drivers/admin/salaries',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
    },
    timeout: 10000,
    proxyTimeout: 10000,
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
    onError: (err: any, req, res) => {
      console.error('Driver salaries proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Driver service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

app.post(
  '/api/drivers/admin/salaries',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
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

app.put(
  '/api/drivers/admin/salaries/:id/status',
  authenticateJWT,
  express.json(),
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
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
      // Write JSON body for PUT request
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err: any, req, res) => {
      console.error('Driver salary status update proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Driver service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Driver Service - Mark driver earnings as paid (auto-create salary)
app.post(
  '/api/drivers/admin/salaries/mark-as-paid/:driverId',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
    },
    timeout: 30000,
    proxyTimeout: 30000,
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
    onError: (err: any, req, res) => {
      console.error('Driver mark as paid proxy error:', err);
      if (!(res as Response).headersSent) {
        (res as Response).status(502).json({
          status: 'error',
          message: 'Driver service unavailable',
          error: err.message || err.code,
        });
      }
    },
  })
);

// Driver Service - Driver profile routes
app.get(
  '/api/drivers/profile',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
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

app.put(
  '/api/drivers/profile',
  authenticateJWT,
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
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

// Driver Service - Internal routes
app.get(
  '/api/drivers/internal/drivers/by-user/:userId',
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
    },
  })
);

app.get(
  '/api/drivers/internal/drivers/:id',
  createProxyMiddleware({
    target: services.driverService,
    changeOrigin: true,
    pathRewrite: {
      '^/api/drivers': '/drivers',
    },
  })
);

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
