import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, UserInput } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Name, email, and password are required',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(400).json({
          status: 'error',
          message: 'Email already exists',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData: UserInput = {
        name,
        email,
        password: hashedPassword,
        phone,
      };

      const user = await UserModel.create(userData);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Email and password are required',
        });
        return;
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
        return;
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password!);
      if (!validPassword) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

