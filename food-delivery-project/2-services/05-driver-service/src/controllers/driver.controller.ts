import { Request, Response } from 'express';
import { DriverModel, DriverSalaryModel } from '../models/driver.model';
import pool from '../database/connection';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export class DriverController {
  // Admin endpoints
  static async getAllDrivers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const drivers = await DriverModel.findAll();

      // Enrich with user details
      const enrichedDrivers = await Promise.all(
        drivers.map(async (driver) => {
          try {
            const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
            const userData = userResponse.data.data;

            // Get driver's active orders
            let activeOrders = 0;
            try {
              const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/internal/orders/driver/${driver.id}`, {
                headers: { Authorization: req.headers.authorization },
              });
              activeOrders = ordersResponse.data.data?.filter((o: any) => o.status === 'ON_THE_WAY').length || 0;
            } catch (error) {
              console.error('Failed to fetch driver orders:', error);
            }

            return {
              id: driver.id,
              user_id: driver.user_id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone || '',
              license_number: driver.vehicle_number, // Map vehicle_number to license_number for frontend
              vehicle_type: driver.vehicle_type,
              vehicle_number: driver.vehicle_number,
              is_available: driver.is_available,
              is_on_job: driver.is_on_job,
              total_earnings: driver.total_earnings,
              active_orders: activeOrders,
              created_at: driver.created_at,
            };
          } catch (error) {
            return {
              id: driver.id,
              user_id: driver.user_id,
              name: 'Unknown',
              email: 'Unknown',
              phone: '',
              license_number: driver.vehicle_number, // Map vehicle_number to license_number for frontend
              vehicle_type: driver.vehicle_type,
              vehicle_number: driver.vehicle_number,
              is_available: driver.is_available,
              is_on_job: driver.is_on_job,
              total_earnings: driver.total_earnings,
              active_orders: 0,
              created_at: driver.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedDrivers,
      });
    } catch (error: any) {
      console.error('Get all drivers error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getDriverSalaries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const driverId = req.query.driver_id ? parseInt(req.query.driver_id as string) : undefined;

      let salaries;
      if (driverId) {
        salaries = await DriverSalaryModel.findByDriverId(driverId);
      } else {
        salaries = await DriverSalaryModel.findAll(limit, offset);
      }

      // Enrich with driver details
      const enrichedSalaries = await Promise.all(
        salaries.map(async (salary) => {
          try {
            const driver = await DriverModel.findById(salary.driver_id);
            if (!driver) {
              return {
                ...salary,
                driver_name: 'Unknown',
              };
            }

            const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
            const userData = userResponse.data.data;

            return {
              id: salary.id,
              driver_id: salary.driver_id,
              driver_name: userData.name,
              driver_email: userData.email,
              amount: parseFloat(salary.base_salary) + parseFloat(salary.commission.toString()),
              period: `${salary.year}-${String(salary.month).padStart(2, '0')}`,
              month: salary.month,
              year: salary.year,
              base_salary: salary.base_salary,
              commission: salary.commission,
              total_orders: salary.total_orders,
              total_earnings: salary.total_earnings,
              status: salary.status,
              created_at: salary.created_at,
            };
          } catch (error) {
            return {
              id: salary.id,
              driver_id: salary.driver_id,
              driver_name: 'Unknown',
              amount: parseFloat(salary.base_salary.toString()) + parseFloat(salary.commission.toString()),
              period: `${salary.year}-${String(salary.month).padStart(2, '0')}`,
              status: salary.status,
              created_at: salary.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedSalaries,
      });
    } catch (error: any) {
      console.error('Get driver salaries error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async createDriverSalary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { driver_id, amount, period, month, year, base_salary, commission } = req.body;

      // Support both formats: period (YYYY-MM) or month/year
      let salaryMonth: number;
      let salaryYear: number;
      let salaryAmount: number;

      if (period) {
        // Parse period format: "YYYY-MM"
        const [yearStr, monthStr] = period.split('-');
        salaryYear = parseInt(yearStr);
        salaryMonth = parseInt(monthStr);
        salaryAmount = amount ? parseFloat(amount) : 0;
      } else if (month && year) {
        salaryMonth = parseInt(month);
        salaryYear = parseInt(year);
        salaryAmount = base_salary ? parseFloat(base_salary) : 0;
      } else {
        res.status(400).json({
          status: 'error',
          message: 'driver_id and period (YYYY-MM) or (month, year) are required',
        });
        return;
      }

      if (!driver_id) {
        res.status(400).json({
          status: 'error',
          message: 'driver_id is required',
        });
        return;
      }

      // Get driver's orders for the month
      let totalOrders = 0;
      let totalEarnings = 0;
      try {
        const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/internal/orders/driver/${driver_id}`, {
          headers: { Authorization: req.headers.authorization },
        });
        const orders = ordersResponse.data.data || [];
        
        // Filter orders by month and year
        const monthOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() + 1 === salaryMonth && orderDate.getFullYear() === salaryYear;
        });

        totalOrders = monthOrders.length;
        totalEarnings = monthOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
      } catch (error) {
        console.error('Failed to fetch driver orders:', error);
      }

      // Calculate base_salary and commission from amount
      const baseSalary = salaryAmount * 0.8; // 80% base salary
      const commissionAmount = commission ? parseFloat(commission) : (salaryAmount * 0.2); // 20% commission or provided

      const salary = await DriverSalaryModel.create({
        driver_id: parseInt(driver_id),
        month: salaryMonth,
        year: salaryYear,
        base_salary: baseSalary,
        commission: commissionAmount,
        total_orders: totalOrders,
        total_earnings: totalEarnings,
      });

      // Return enriched salary data
      const driver = await DriverModel.findById(salary.driver_id);
      let driverName = 'Unknown';
      if (driver) {
        try {
          const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
          driverName = userResponse.data.data?.name || 'Unknown';
        } catch (error) {
          console.error('Failed to fetch driver user:', error);
        }
      }

      res.status(201).json({
        status: 'success',
        message: 'Driver salary created successfully',
        data: {
          id: salary.id,
          driver_id: salary.driver_id,
          driver_name: driverName,
          amount: parseFloat(salary.base_salary.toString()) + parseFloat(salary.commission.toString()),
          period: `${salary.year}-${String(salary.month).padStart(2, '0')}`,
          status: salary.status,
          created_at: salary.created_at,
        },
      });
    } catch (error: any) {
      console.error('Create driver salary error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async updateSalaryStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const salaryId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !['PENDING', 'PAID'].includes(status)) {
        res.status(400).json({
          status: 'error',
          message: 'Valid status (PENDING or PAID) is required',
        });
        return;
      }

      const salary = await DriverSalaryModel.updateStatus(salaryId, status);
      if (!salary) {
        res.status(404).json({
          status: 'error',
          message: 'Salary not found',
        });
        return;
      }

      // Return enriched salary data
      const driver = await DriverModel.findById(salary.driver_id);
      let driverName = 'Unknown';
      if (driver) {
        try {
          const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
          driverName = userResponse.data.data?.name || 'Unknown';
        } catch (error) {
          console.error('Failed to fetch driver user:', error);
        }
      }

      res.json({
        status: 'success',
        message: 'Salary status updated successfully',
        data: {
          id: salary.id,
          driver_id: salary.driver_id,
          driver_name: driverName,
          amount: parseFloat(salary.base_salary.toString()) + parseFloat(salary.commission.toString()),
          period: `${salary.year}-${String(salary.month).padStart(2, '0')}`,
          status: salary.status,
          created_at: salary.created_at,
        },
      });
    } catch (error: any) {
      console.error('Update salary status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint to get driver by user ID
  static async getDriverByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
        return;
      }

      const driver = await DriverModel.findByUserId(userId);
      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver not found for this user',
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          id: driver.id,
          user_id: driver.user_id,
          vehicle_type: driver.vehicle_type,
          vehicle_number: driver.vehicle_number,
          is_available: driver.is_available,
          is_on_job: driver.is_on_job,
          total_earnings: driver.total_earnings,
        },
      });
    } catch (error: any) {
      console.error('Get driver by user ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint for other services
  static async getDriverById(req: Request, res: Response): Promise<void> {
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

      // Enrich with user details
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
        const userData = userResponse.data.data;

        res.json({
          status: 'success',
          data: {
            id: driver.id,
            user_id: driver.user_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            is_available: driver.is_available,
            is_on_job: driver.is_on_job,
            total_earnings: driver.total_earnings,
            created_at: driver.created_at,
          },
        });
      } catch (error) {
      res.json({
        status: 'success',
        data: {
          id: driver.id,
            user_id: driver.user_id,
            name: 'Unknown',
            email: 'Unknown',
            phone: 'Unknown',
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            is_available: driver.is_available,
            is_on_job: driver.is_on_job,
            total_earnings: driver.total_earnings,
            created_at: driver.created_at,
        },
      });
      }
    } catch (error: any) {
      console.error('Get driver by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Driver profile endpoints
  static async getDriverProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const driver = await DriverModel.findByUserId(userId);
      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver profile not found',
        });
        return;
      }

      // Enrich with user details
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${driver.user_id}`);
        const userData = userResponse.data.data;

      res.json({
        status: 'success',
        data: {
          id: driver.id,
            user_id: driver.user_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            is_available: driver.is_available,
            is_on_job: driver.is_on_job,
            total_earnings: driver.total_earnings,
            created_at: driver.created_at,
          },
        });
      } catch (error) {
        res.json({
          status: 'success',
          data: {
            id: driver.id,
            user_id: driver.user_id,
            name: 'Unknown',
            email: 'Unknown',
            phone: 'Unknown',
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            is_available: driver.is_available,
            is_on_job: driver.is_on_job,
            total_earnings: driver.total_earnings,
            created_at: driver.created_at,
          },
        });
      }
    } catch (error: any) {
      console.error('Get driver profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async updateDriverProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const driver = await DriverModel.findByUserId(userId);
      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver profile not found',
        });
        return;
      }

      const { vehicle_type, vehicle_number, is_available } = req.body;

      // Update driver fields
      if (vehicle_type !== undefined) {
        await pool.execute('UPDATE drivers SET vehicle_type = ? WHERE id = ?', [vehicle_type, driver.id]);
      }
      if (vehicle_number !== undefined) {
        await pool.execute('UPDATE drivers SET vehicle_number = ? WHERE id = ?', [vehicle_number, driver.id]);
      }
      if (is_available !== undefined) {
        await pool.execute('UPDATE drivers SET is_available = ? WHERE id = ?', [is_available, driver.id]);
      }

      const updatedDriver = await DriverModel.findById(driver.id);

      res.json({
        status: 'success',
        message: 'Driver profile updated successfully',
        data: updatedDriver,
      });
    } catch (error: any) {
      console.error('Update driver profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}
