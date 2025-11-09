import { Request, Response } from 'express';
import { UserModel, AddressModel, AddressInput } from '../models/user.model';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export class UserController {
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getAddresses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const addresses = await AddressModel.findByUserId(userId);

      res.json({
        status: 'success',
        data: addresses.map((addr) => ({
          id: addr.id,
          label: addr.label,
          full_address: addr.full_address,
          latitude: addr.latitude,
          longitude: addr.longitude,
          is_default: addr.is_default,
        })),
      });
    } catch (error: any) {
      console.error('Get addresses error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async createAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const { label, full_address, latitude, longitude, is_default } = req.body;

      if (!label || !full_address) {
        res.status(400).json({
          status: 'error',
          message: 'Label and full_address are required',
        });
        return;
      }

      const addressData: AddressInput = {
        label,
        full_address,
        latitude,
        longitude,
        is_default,
      };

      const address = await AddressModel.create(userId, addressData);

      res.status(201).json({
        status: 'success',
        message: 'Address created successfully',
        data: address,
      });
    } catch (error: any) {
      console.error('Create address error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint for other services
  static async getInternalUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('Get internal user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

