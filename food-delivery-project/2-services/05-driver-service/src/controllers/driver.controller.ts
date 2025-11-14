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
  static async getAllDrivers(_req: AuthRequest, res: Response): Promise<void> {
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
            // Order Service returns only active orders (ON_THE_WAY, PREPARING) for this driver
            let activeOrders: any[] = [];
            try {
              // Path: /orders/internal/orders/driver/:driverId (because orderRoutes is mounted at /orders)
              // SOA: Driver Service → Order Service (service-to-service, no auth needed)
              const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/orders/internal/orders/driver/${driver.id}`, {
                timeout: 5000,
                // No Authorization header needed for internal SOA communication
              });
              
              if (ordersResponse.data && ordersResponse.data.status === 'success') {
                const allOrders = ordersResponse.data.data || [];
                console.log(`🔍 SOA Debug - Driver ${driver.id} (${userData.name}):`);
                console.log(`   - Received ${allOrders.length} orders from Order Service`);
                console.log(`   - Orders:`, allOrders.map((o: any) => ({
                  id: o.id || o.order_id,
                  driver_id: o.driver_id,
                  status: o.status,
                  driver_id_match: o.driver_id === driver.id
                })));
                
                // Order Service already filters by driver_id and active status (ON_THE_WAY, PREPARING)
                // But we only show ON_THE_WAY orders in active_orders_details (driver has accepted)
                // PREPARING orders are not yet accepted by driver, so they don't count as active jobs
                activeOrders = allOrders.filter((o: any) => {
                  // Ensure driver_id matches and status is ON_THE_WAY (driver has accepted)
                  // IMPORTANT: Convert to number for comparison (driver_id might be string from JSON)
                  const orderDriverId = typeof o.driver_id === 'string' ? parseInt(o.driver_id) : o.driver_id;
                  const driverIdNum = typeof driver.id === 'string' ? parseInt(driver.id) : driver.id;
                  const matches = o.status === 'ON_THE_WAY' && orderDriverId === driverIdNum;
                  if (o.status === 'ON_THE_WAY') {
                    console.log(`   - Order ${o.id || o.order_id}: driver_id=${o.driver_id} (${typeof o.driver_id}), driver.id=${driver.id} (${typeof driver.id}), orderDriverId=${orderDriverId}, driverIdNum=${driverIdNum}, match=${matches}`);
                  }
                  return matches;
                });
                
                console.log(`✅ SOA: Driver ${driver.id} - Fetched ${allOrders.length} orders from Order Service, ${activeOrders.length} active (ON_THE_WAY)`);
              } else {
                console.error(`❌ SOA: Invalid response from Order Service for driver ${driver.id}:`, ordersResponse.data);
              }
            } catch (error: any) {
              console.error(`❌ SOA Error: Failed to fetch driver orders for driver ${driver.id}:`, error.message);
              console.error(`   Order Service URL: ${ORDER_SERVICE_URL}/orders/internal/orders/driver/${driver.id}`);
            }

            // Update driver availability based on active orders (SOA: real-time from Order Service)
            // Driver is available ONLY if no active orders (ON_THE_WAY) assigned to them
            // This ensures real-time status update based on actual order data from Order Service
            const hasActiveOrders = activeOrders.length > 0;
            
            // SOA: Real-time availability based on Order Service data
            // If driver has ON_THE_WAY orders, they are NOT available (Busy/On Job)
            const isAvailableRealTime = !hasActiveOrders && driver.is_available;
            const isOnJobRealTime = hasActiveOrders || driver.is_on_job;
            
            console.log(`📊 SOA Status - Driver ${driver.id} (${userData.name}):`);
            console.log(`   - Active Orders (ON_THE_WAY): ${activeOrders.length}`);
            console.log(`   - hasActiveOrders: ${hasActiveOrders}`);
            console.log(`   - is_available (real-time): ${isAvailableRealTime} (was: ${driver.is_available})`);
            console.log(`   - is_on_job (real-time): ${isOnJobRealTime} (was: ${driver.is_on_job})`);

            return {
              id: driver.id,
              user_id: driver.user_id,
              name: userData.name || `Driver ${driver.id}`,
              email: userData.email || '',
              phone: userData.phone || '-', // Use '-' instead of empty string for better UX
              license_number: driver.vehicle_number, // Map vehicle_number to license_number for frontend
              vehicle_type: driver.vehicle_type,
              vehicle_number: driver.vehicle_number,
              is_available: isAvailableRealTime, // SOA: Real-time from Order Service
              is_on_job: isOnJobRealTime, // SOA: Real-time from Order Service
              total_earnings: driver.total_earnings,
              active_orders: activeOrders.length,
              active_orders_details: activeOrders.map((o: any) => ({
                order_id: o.id || o.order_id,
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
              total_earnings: typeof salary.total_earnings === 'number' 
                ? salary.total_earnings 
                : parseFloat(String(salary.total_earnings || 0)), // Total pendapatan dari driver_salaries (SOA) - ensure number
              status: salary.status,
              created_at: salary.created_at,
            };
          } catch (error: any) {
            console.error(`❌ Failed to fetch user data for salary driver_id ${salary.driver_id}:`, error.message);
            console.error(`   User Service URL: ${USER_SERVICE_URL}/users/internal/users/${salary.driver_id || 'N/A'}`);
            return {
              id: salary.id,
              driver_id: salary.driver_id,
              driver_name: `Driver ${salary.driver_id}`, // Better fallback
              driver_email: '',
              total_earnings: typeof salary.total_earnings === 'number' 
                ? salary.total_earnings 
                : parseFloat(String(salary.total_earnings || 0)), // Total pendapatan dari driver_salaries (SOA) - ensure number
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

        // SOA: Path: /orders/internal/orders/driver/:driverId (because orderRoutes is mounted at /orders)
        // Service-to-service communication, no auth needed
        const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/orders/internal/orders/driver/${driver.id}`, {
          timeout: 5000,
        });
        const orders = ordersResponse.data.data || [];
        
        // Filter orders by month and year
        const monthOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() + 1 === salaryMonth && orderDate.getFullYear() === salaryYear;
        });

        totalOrders = monthOrders.length;
        // Driver earns 20,000 per order (fixed rate)
        // totalEarnings = total orders * 20,000
        totalEarnings = totalOrders * 20000; // Fixed: 20rb per order
      } catch (error) {
        console.error('Failed to fetch driver orders:', error);
      }

      // Fixed salary calculation: base salary 2,000,000 + commission (20rb per order)
      const baseSalary = 2000000; // Fixed base salary
      const commissionAmount = totalEarnings; // Commission = total orders * 20rb (already calculated above)

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

  // New endpoint: Mark driver earnings as paid (auto-create salary and reset earnings)
  static async markDriverEarningsAsPaid(req: AuthRequest, res: Response): Promise<void> {
    try {
      const driverId = parseInt(req.params.driverId);

      // Get driver
      const driver = await DriverModel.findById(driverId);
      if (!driver) {
        res.status(404).json({
          status: 'error',
          message: 'Driver not found',
        });
        return;
      }

      // Check if driver has earnings to pay
      if (!driver.total_earnings || driver.total_earnings <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Driver has no earnings to pay',
        });
        return;
      }

      // Get current month and year (for record keeping, but allow multiple payments per month)
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // SOA: Get driver's ALL delivered orders from Order Service (not filtered by month)
      // This allows multiple mark-as-paid per month
      let totalOrders = 0;
      try {
        const ordersResponse = await axios.get(`${ORDER_SERVICE_URL}/orders/internal/orders/driver/${driver.id}`, {
          timeout: 5000,
        });
        const allOrders = ordersResponse.data.data || [];
        
        // Count ALL delivered orders (not filtered by month - allows multiple payments)
        const deliveredOrders = allOrders.filter((order: any) => {
          return order.status === 'DELIVERED';
        });

        totalOrders = deliveredOrders.length;
        console.log(`✅ SOA: Found ${totalOrders} total delivered orders for driver ${driver.id} (all time)`);
      } catch (error: any) {
        console.error(`❌ SOA: Failed to fetch driver orders for driver ${driver.id}:`, error.message);
        // Continue with totalOrders = 0 if Order Service fails
      }

      // Calculate salary components
      const baseSalary = 2000000; // Fixed base salary
      const commissionAmount = driver.total_earnings; // Commission = total_earnings (20rb per order)
      const totalEarnings = driver.total_earnings; // Total earnings to be saved in salary record

      // Create salary record with status PAID
      const salary = await DriverSalaryModel.create({
        driver_id: driverId,
        month: currentMonth,
        year: currentYear,
        base_salary: baseSalary,
        commission: commissionAmount,
        total_orders: totalOrders,
        total_earnings: totalEarnings,
      });

      // Update salary status to PAID immediately
      await DriverSalaryModel.updateStatus(salary.id, 'PAID');

      // Reset driver total_earnings to 0
      // Use pool.execute directly (more reliable)
      await pool.execute('UPDATE drivers SET total_earnings = 0.00 WHERE id = ?', [driverId]);
      console.log(`✅ Reset driver ${driverId} total_earnings to 0.00`);

      console.log(`✅ Marked driver ${driverId} earnings as paid: Rp ${totalEarnings.toLocaleString()}, reset to 0`);

      // Get driver user details for response
      let driverName = 'Unknown';
      let driverEmail = '';
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`, {
          timeout: 5000,
        });
        const userData = userResponse.data.data;
        driverName = userData?.name || 'Unknown';
        driverEmail = userData?.email || '';
      } catch (error) {
        console.error('Failed to fetch driver user:', error);
      }

      // Get updated salary
      const updatedSalary = await DriverSalaryModel.findById(salary.id);

      res.json({
        status: 'success',
        message: 'Driver earnings marked as paid successfully',
        data: {
          id: updatedSalary!.id,
          driver_id: driverId,
          driver_name: driverName,
          driver_email: driverEmail,
          total_earnings: updatedSalary!.total_earnings,
          status: updatedSalary!.status,
          created_at: updatedSalary!.created_at,
        },
      });
    } catch (error: any) {
      console.error('Mark driver earnings as paid error:', error);
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

      // Enrich with user details (SOA: Driver Service calls User Service)
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driver.user_id}`, {
          timeout: 5000,
        });
        const userData = userResponse.data.data;

        res.json({
          status: 'success',
          data: {
            id: driver.id,
            user_id: driver.user_id,
            name: userData.name || `Driver ${driver.id}`,
            email: userData.email || '',
            phone: userData.phone || '-',
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            vehicle: `${driver.vehicle_type} - ${driver.vehicle_number}`,
            is_available: driver.is_available,
            is_on_job: driver.is_on_job,
            total_earnings: driver.total_earnings,
            created_at: driver.created_at,
          },
        });
      } catch (error: any) {
        console.error('Failed to fetch user details for driver:', error);
        res.json({
          status: 'success',
          data: {
            id: driver.id,
            user_id: driver.user_id,
            name: 'Unknown',
            email: '',
            phone: '-',
            vehicle_type: driver.vehicle_type,
            vehicle_number: driver.vehicle_number,
            vehicle: `${driver.vehicle_type} - ${driver.vehicle_number}`,
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

  // Internal endpoint for SOA: Update driver earnings when order is completed
  static async updateDriverEarnings(req: Request, res: Response): Promise<void> {
    try {
      const driverId = parseInt(req.params.id);
      const { amount } = req.body;

      if (!driverId || !amount) {
        res.status(400).json({
          status: 'error',
          message: 'Driver ID and amount are required',
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

      // Update driver earnings
      await DriverModel.updateEarnings(driverId, amount);
      const updatedDriver = await DriverModel.findById(driverId);

      console.log(`✅ SOA: Updated driver ${driverId} earnings by ${amount}. New total: ${updatedDriver?.total_earnings}`);

      res.json({
        status: 'success',
        message: 'Driver earnings updated successfully',
        data: updatedDriver,
      });
    } catch (error: any) {
      console.error('Update driver earnings error:', error);
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
