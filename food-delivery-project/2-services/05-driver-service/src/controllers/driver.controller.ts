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
            // SOA Communication: Driver Service calls User Service to get user data
            // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
            const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`, {
              timeout: 5000,
            });
            
            if (!userResponse.data || userResponse.data.status !== 'success') {
              throw new Error('Invalid response from User Service');
            }
            
            const userData = userResponse.data.data;
            console.log(`✅ Fetched user data for driver ${driver.id}, user_id ${driver.user_id}:`, {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
            });

            // SOA Communication: Driver Service calls Order Service to get active orders
            let activeOrders: any[] = [];
            try {
              const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/internal/orders/driver/${driver.id}`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 5000,
              });
              const allOrders = ordersResponse.data.data || [];
              activeOrders = allOrders.filter((o: any) => 
                o.status === 'ON_THE_WAY' || o.status === 'PREPARING'
              );
            } catch (error) {
              console.error(`⚠️  Failed to fetch driver orders for driver ${driver.id}:`, error);
            }

            return {
              id: driver.id,
              user_id: driver.user_id,
              name: userData.name || `Driver ${driver.id}`,
              email: userData.email || '',
              phone: userData.phone || '-', // Use '-' instead of empty string for better UX
              license_number: driver.vehicle_number, // Map vehicle_number to license_number for frontend
              vehicle_type: driver.vehicle_type,
              vehicle_number: driver.vehicle_number,
              is_available: driver.is_available,
              is_on_job: driver.is_on_job,
              total_earnings: driver.total_earnings,
              active_orders: activeOrders.length,
              active_orders_details: activeOrders.map((o: any) => ({
                order_id: o.id,
                customer_name: o.customer_name || 'Unknown',
                restaurant_name: o.restaurant_name || 'Unknown',
                status: o.status,
                total_price: o.total_price,
                created_at: o.created_at,
              })),
              created_at: driver.created_at,
            };
          } catch (error: any) {
            console.error(`❌ Failed to fetch user data for driver ${driver.id}, user_id ${driver.user_id}:`, error.message);
            console.error(`   User Service URL: ${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`);
            // Fallback: return driver data without user enrichment
            return {
              id: driver.id,
              user_id: driver.user_id,
              name: `Driver ${driver.id}`, // Better fallback than "Unknown"
              email: '',
              phone: '-', // Use '-' instead of empty string
              license_number: driver.vehicle_number,
              vehicle_type: driver.vehicle_type,
              vehicle_number: driver.vehicle_number,
              is_available: driver.is_available,
              is_on_job: driver.is_on_job,
              total_earnings: driver.total_earnings,
              active_orders: 0,
              active_orders_details: [],
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

            // SOA Communication: Driver Service calls User Service to get driver name
            // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
            const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`, {
              timeout: 5000,
            });
            
            if (!userResponse.data || userResponse.data.status !== 'success') {
              throw new Error('Invalid response from User Service');
            }
            
            const userData = userResponse.data.data;
            console.log(`✅ Fetched user data for salary driver_id ${salary.driver_id}, user_id ${driver.user_id}:`, {
              name: userData.name,
              email: userData.email,
            });

            return {
              id: salary.id,
              driver_id: salary.driver_id,
              driver_name: userData.name || `Driver ${salary.driver_id}`,
              driver_email: userData.email || '',
              amount: parseFloat(salary.base_salary.toString()) + parseFloat(salary.commission.toString()),
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
          } catch (error: any) {
            console.error(`❌ Failed to fetch user data for salary driver_id ${salary.driver_id}:`, error.message);
            console.error(`   User Service URL: ${USER_SERVICE_URL}/users/internal/users/${driver?.user_id || 'N/A'}`);
            return {
              id: salary.id,
              driver_id: salary.driver_id,
              driver_name: `Driver ${salary.driver_id}`, // Better fallback
              driver_email: '',
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
      const { driver_id, period } = req.body;

      if (!driver_id || !period) {
        res.status(400).json({
          status: 'error',
          message: 'driver_id and period (YYYY-MM) are required',
        });
        return;
      }

      // Parse period format: "YYYY-MM"
      const parts = period.split('-');
      if (parts.length !== 2) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid period format. Use YYYY-MM',
        });
        return;
      }
      const salaryYear = parseInt(parts[0]);
      const salaryMonth = parseInt(parts[1]);

      if (isNaN(salaryYear) || isNaN(salaryMonth) || salaryMonth < 1 || salaryMonth > 12) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid period. Month must be 01-12',
        });
        return;
      }

      // Check if salary already exists for this driver and period
      const existingSalaries = await DriverSalaryModel.findByDriverId(parseInt(driver_id));
      const existing = existingSalaries.find(
        (s) => s.year === salaryYear && s.month === salaryMonth
      );
      if (existing) {
        res.status(400).json({
          status: 'error',
          message: `Salary for period ${period} already exists for this driver`,
        });
        return;
      }

      // Get driver's orders for the month
      let totalOrders = 0;
      let totalEarnings = 0;
      try {
        const driver = await DriverModel.findById(parseInt(driver_id));
        if (!driver) {
          res.status(404).json({
            status: 'error',
            message: 'Driver not found',
          });
          return;
        }

        const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/internal/orders/driver/${driver.id}`, {
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

      // Fixed salary calculation: base salary 2,000,000 + commission (10% of total earnings)
      const baseSalary = 2000000; // Fixed base salary
      const commissionAmount = totalEarnings * 0.1; // 10% commission from earnings

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
      let driverEmail = '';
      if (driver) {
        try {
          const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`);
          const userData = userResponse.data.data;
          driverName = userData?.name || 'Unknown';
          driverEmail = userData?.email || '';
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
          driver_email: driverEmail,
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
          const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`);
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
