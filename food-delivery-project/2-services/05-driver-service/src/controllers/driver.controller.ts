import { Request, Response } from 'express';
import { DriverModel } from '../models/driver.model';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export class DriverController {
  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const { status } = req.body;

      if (!status) {
        res.status(400).json({
          status: 'error',
          message: 'status is required',
        });
        return;
      }

      // For demo purposes, we'll use user_id as driver_id
      // In production, you would have a separate driver authentication
      const driver = await DriverModel.updateStatus(userId, status);

      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver not found',
        });
        return;
      }

      res.json({
        status: 'success',
        message: 'Driver status updated',
        data: {
          driver_id: driver.id,
          name: driver.name,
          status: driver.status,
        },
      });
    } catch (error: any) {
      console.error('Update driver status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint for other services
  static async getInternalDriver(req: Request, res: Response): Promise<void> {
    try {
      const driverId = parseInt(req.params.id);

      if (!driverId) {
        res.status(400).json({
          status: 'error',
          message: 'Driver ID is required',
        });
        return;
      }

      const driver = await DriverModel.findById(driverId);
      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver not found',
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle,
          status: driver.status,
        },
      });
    } catch (error: any) {
      console.error('Get internal driver error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async assignDriver(req: Request, res: Response): Promise<void> {
    try {
      const { order_id } = req.body;

      if (!order_id) {
        res.status(400).json({
          status: 'error',
          message: 'order_id is required',
        });
        return;
      }

      // Find available driver
      const availableDrivers = await DriverModel.findAvailable();
      if (availableDrivers.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No available drivers',
        });
        return;
      }

      const driver = availableDrivers[0];

      // Update driver status to BUSY
      await DriverModel.updateStatus(driver.id, 'BUSY');

      res.json({
        status: 'success',
        data: {
          id: driver.id,
          driver_id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle,
        },
      });
    } catch (error: any) {
      console.error('Assign driver error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

