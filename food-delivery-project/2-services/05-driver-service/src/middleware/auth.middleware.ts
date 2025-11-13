import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // Also check X-User-Id header (from API Gateway)
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'] as string;

  if (userId && userEmail) {
    req.user = {
      id: parseInt(userId as string),
      email: userEmail,
      role: req.headers['x-user-role'] as string,
    };
    next();
    return;
  }

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token.',
    });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin role required.',
    });
    return;
  }

  next();
};

export const authorizeDriver = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'driver') {
    res.status(403).json({
      status: 'error',
      message: 'Access denied. Driver role required.',
    });
    return;
  }

  next();
};

