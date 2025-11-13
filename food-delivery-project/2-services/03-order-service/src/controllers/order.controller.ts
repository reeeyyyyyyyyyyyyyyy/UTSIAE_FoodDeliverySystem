import { Request, Response } from 'express';
import { OrderModel, OrderInput } from '../models/order.model';
import { OrderService } from '../services/order.service';
import pool from '../database/connection';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3005';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const { restaurant_id, address_id, items } = req.body;

      if (!restaurant_id || !address_id || !items || !Array.isArray(items)) {
        res.status(400).json({
          status: 'error',
          message: 'restaurant_id, address_id, and items array are required',
        });
        return;
      }

      const orderData: OrderInput = {
        restaurant_id,
        address_id,
        items,
      };

      const { order, paymentId } = await OrderService.createOrder(userId, orderData);

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully, awaiting payment.',
        data: {
          order_id: order.id,
          status: order.status,
          total_price: order.total_price,
          payment_id: paymentId,
        },
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to create order',
        details: error.message,
      });
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const orders = await OrderModel.findByUserId(userId);

      // Enrich with restaurant names
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            return {
              order_id: order.id,
              restaurant_name: restaurantName,
              status: order.status,
              total_price: order.total_price,
              created_at: order.created_at,
            };
          } catch (error) {
            return {
              order_id: order.id,
              restaurant_name: 'Unknown',
              status: order.status,
              total_price: order.total_price,
              created_at: order.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const orderId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        res.status(404).json({
          status: 'error',
          message: 'Order not found',
        });
        return;
      }

      // Verify order belongs to user
      if (order.user_id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      // Get order items
      const orderItems = await OrderModel.findItemsByOrderId(orderId);

      // Get restaurant details (SOA: Order Service calls Restaurant Service)
      // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
      let restaurantDetails = { name: 'Unknown', address: 'Unknown' };
      try {
        const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
          timeout: 5000,
        });
        const restaurantData = restaurantResponse.data.data;
        restaurantDetails = { name: restaurantData.restaurant_name || 'Unknown', address: 'Unknown' };
        
        // Get full restaurant info for address
        const restaurantInfo = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants`, {
          timeout: 5000,
        });
        const restaurants = restaurantInfo.data.data || [];
        const restaurant = restaurants.find((r: any) => r.id === order.restaurant_id);
        if (restaurant) {
          restaurantDetails = { name: restaurant.name || restaurantData.restaurant_name, address: restaurant.address || 'Unknown' };
        }
      } catch (error) {
        console.error('Failed to fetch restaurant details:', error);
      }

      // Get user address and customer name (SOA: Order Service calls User Service)
      // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
      let deliveryAddress = 'Unknown';
      let customerName = 'Unknown';
      let userResponse: any = null;
      
      try {
        userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${userId}`, {
          timeout: 5000,
        });
        customerName = userResponse?.data?.data?.name || 'Unknown';
        
        // Path: /users/addresses (because userRoutes is mounted at /users)
        const addressesResponse = await axios.get(`${USER_SERVICE_URL}/users/addresses`, {
          headers: { Authorization: req.headers.authorization },
          timeout: 5000,
        });
        const addresses = addressesResponse.data.data;
        const address = addresses.find((a: any) => a.id === order.address_id);
        if (address) {
          deliveryAddress = address.full_address;
        }
      } catch (error) {
        console.error('Failed to fetch address:', error);
      }

      // Get driver details if order is assigned (SOA: Order Service calls Driver Service)
      // Path: /drivers/internal/drivers/:id (because driverRoutes is mounted at /drivers)
      let driverDetails = null;
      if (order.driver_id) {
        try {
          const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/drivers/internal/drivers/${order.driver_id}`, {
            timeout: 5000,
          });
          driverDetails = driverResponse.data.data;
        } catch (error) {
          console.error('Failed to fetch driver details:', error);
        }
      }
      
      res.json({
        status: 'success',
        data: {
          order_id: order.id,
          restaurant_name: restaurantDetails.name,
          customer_name: customerName,
          customer_address: deliveryAddress,
          status: order.status,
          restaurant_details: restaurantDetails,
          delivery_address: deliveryAddress,
          driver_details: driverDetails,
          items: orderItems.map((item) => ({
            menu_item_name: item.menu_item_name,
            quantity: item.quantity,
            price: item.price,
          })),
          total_price: order.total_price,
          estimated_delivery_time: order.estimated_delivery_time,
          created_at: order.created_at,
        },
      });
    } catch (error: any) {
      console.error('Get order by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Driver endpoints
  static async getAvailableOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get orders with status PREPARING (ready for driver pickup)
      const orders = await OrderModel.findByStatus('PREPARING');

      // Enrich with restaurant and customer details
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // Get restaurant details
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            // Get customer details (SOA: Order Service calls User Service)
            // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
            const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${order.user_id}`, {
              timeout: 5000,
            });
            const customerName = userResponse.data.data.name;

            // Get customer address
            let customerAddress = 'Unknown';
            try {
              // Path: /users/addresses (because userRoutes is mounted at /users)
              const addressesResponse = await axios.get(`${USER_SERVICE_URL}/users/addresses`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 5000,
              });
              const addresses = addressesResponse.data.data;
              const address = addresses.find((a: any) => a.id === order.address_id);
              if (address) {
                customerAddress = address.full_address;
              }
            } catch (error) {
              console.error('Failed to fetch address:', error);
            }

            // Get order items
            const orderItems = await OrderModel.findItemsByOrderId(order.id);

            return {
              order_id: order.id,
              restaurant_name: restaurantName,
              customer_name: customerName,
              customer_address: customerAddress,
              status: order.status,
              total_price: order.total_price,
              created_at: order.created_at,
              items: orderItems.map((item) => ({
                menu_item_name: item.menu_item_name,
                quantity: item.quantity,
                price: item.price,
              })),
            };
          } catch (error) {
            console.error('Failed to enrich order:', error);
            return {
              order_id: order.id,
              restaurant_name: 'Unknown',
              customer_name: 'Unknown',
              customer_address: 'Unknown',
              status: order.status,
              total_price: order.total_price,
              created_at: order.created_at,
              items: [],
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get available orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async acceptOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const orderId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          status: 'error',
          message: 'Order ID is required',
        });
        return;
      }

      // Get driver ID from user ID
      let driverId: number;
      try {
        // Path: /drivers/internal/drivers/by-user/:userId (because driverRoutes is mounted at /drivers)
        const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/drivers/internal/drivers/by-user/${userId}`, {
          timeout: 5000,
        });
        if (driverResponse.data.status === 'success' && driverResponse.data.data) {
          driverId = driverResponse.data.data.id;
        } else {
          res.status(404).json({
            status: 'error',
            message: 'Driver profile not found for this user',
          });
          return;
        }
      } catch (error: any) {
        console.error('Failed to get driver by user ID:', error);
        res.status(404).json({
          status: 'error',
          message: 'Driver profile not found for this user',
        });
        return;
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        res.status(404).json({
          status: 'error',
          message: 'Order not found',
        });
        return;
      }

      if (order.status !== 'PREPARING') {
        res.status(400).json({
          status: 'error',
          message: 'Order is not available for pickup',
        });
        return;
      }

      if (order.driver_id) {
        res.status(400).json({
          status: 'error',
          message: 'Order already assigned to another driver',
        });
        return;
      }

      // Calculate estimated delivery time (30 minutes from now)
      const estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);

      // Update order status and assign driver
      await OrderModel.updateStatus(orderId, 'ON_THE_WAY', driverId, estimatedDeliveryTime);

      const updatedOrder = await OrderModel.findById(orderId);

      res.json({
        status: 'success',
        message: 'Order accepted successfully',
        data: {
          order_id: updatedOrder!.id,
          status: updatedOrder!.status,
          driver_id: updatedOrder!.driver_id,
          estimated_delivery_time: updatedOrder!.estimated_delivery_time,
        },
      });
    } catch (error: any) {
      console.error('Accept order error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async completeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const orderId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          status: 'error',
          message: 'Order ID is required',
        });
        return;
      }

      // Get driver ID from user ID
      let driverId: number;
      try {
        // Path: /drivers/internal/drivers/by-user/:userId (because driverRoutes is mounted at /drivers)
        const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/drivers/internal/drivers/by-user/${userId}`, {
          timeout: 5000,
        });
        if (driverResponse.data.status === 'success' && driverResponse.data.data) {
          driverId = driverResponse.data.data.id;
        } else {
          res.status(404).json({
            status: 'error',
            message: 'Driver profile not found for this user',
          });
          return;
        }
      } catch (error: any) {
        console.error('Failed to get driver by user ID:', error);
        res.status(404).json({
          status: 'error',
          message: 'Driver profile not found for this user',
        });
        return;
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        res.status(404).json({
          status: 'error',
          message: 'Order not found',
        });
        return;
      }

      if (order.driver_id !== driverId) {
        res.status(403).json({
          status: 'error',
          message: 'This order is not assigned to you',
        });
        return;
      }

      if (order.status !== 'ON_THE_WAY') {
        res.status(400).json({
          status: 'error',
          message: 'Order is not in ON_THE_WAY status',
        });
        return;
      }

      // Update order status to DELIVERED
      await OrderModel.updateStatus(orderId, 'DELIVERED');

      const updatedOrder = await OrderModel.findById(orderId);

      res.json({
        status: 'success',
        message: 'Order completed successfully',
        data: {
          order_id: updatedOrder!.id,
          status: updatedOrder!.status,
        },
      });
    } catch (error: any) {
      console.error('Complete order error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getDriverOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      // Get driver ID from user ID
      let driverId: number;
      try {
        // Path: /drivers/internal/drivers/by-user/:userId (because driverRoutes is mounted at /drivers)
        const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/drivers/internal/drivers/by-user/${userId}`, {
          timeout: 5000,
        });
        if (driverResponse.data.status === 'success' && driverResponse.data.data) {
          driverId = driverResponse.data.data.id;
        } else {
          res.status(404).json({
            status: 'error',
            message: 'Driver profile not found for this user',
          });
          return;
        }
      } catch (error: any) {
        console.error('Failed to get driver by user ID:', error);
        res.status(404).json({
          status: 'error',
          message: 'Driver profile not found for this user',
        });
        return;
      }

      const orders = await OrderModel.findByDriverId(driverId);

      // Filter only active orders (ON_THE_WAY)
      const activeOrders = orders.filter((order) => order.status === 'ON_THE_WAY');

      // Enrich with restaurant and customer details
      const enrichedOrders = await Promise.all(
        activeOrders.map(async (order) => {
          try {
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            // SOA: Order Service calls User Service
            const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${order.user_id}`, {
              timeout: 5000,
            });
            const customerName = userResponse.data.data.name;

            let customerAddress = 'Unknown';
            try {
              // Path: /users/addresses (because userRoutes is mounted at /users)
              const addressesResponse = await axios.get(`${USER_SERVICE_URL}/users/addresses`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 5000,
              });
              const addresses = addressesResponse.data.data;
              const address = addresses.find((a: any) => a.id === order.address_id);
              if (address) {
                customerAddress = address.full_address;
              }
            } catch (error) {
              console.error('Failed to fetch address:', error);
            }

            const orderItems = await OrderModel.findItemsByOrderId(order.id);

            return {
              order_id: order.id,
              restaurant_name: restaurantName,
              customer_name: customerName,
              customer_address: customerAddress,
              status: order.status,
              total_price: order.total_price,
              estimated_delivery_time: order.estimated_delivery_time,
              created_at: order.created_at,
              items: orderItems.map((item) => ({
                menu_item_name: item.menu_item_name,
                quantity: item.quantity,
                price: item.price,
              })),
            };
          } catch (error) {
            console.error('Failed to enrich order:', error);
            return {
              order_id: order.id,
              restaurant_name: 'Unknown',
              customer_name: 'Unknown',
              customer_address: 'Unknown',
              status: order.status,
              total_price: order.total_price,
              estimated_delivery_time: order.estimated_delivery_time,
              created_at: order.created_at,
              items: [],
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get driver orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Admin endpoints
  static async getSalesStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      // Get overall statistics
      const totalOrders = await OrderModel.getTotalOrders();
      const totalRevenue = await OrderModel.getTotalRevenue();
      
      // Get completed and pending orders
      const [completedResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM orders WHERE status = ?',
        ['DELIVERED']
      ) as any[];
      const completedOrders = completedResult[0]?.count || 0;

      const [pendingResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM orders WHERE status IN (?, ?, ?, ?)',
        ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'ON_THE_WAY']
      ) as any[];
      const pendingOrders = pendingResult[0]?.count || 0;

      // Calculate average order value from all orders (not just completed)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get daily statistics
      const dailyStatistics = await OrderModel.getSalesStatistics(startDate, endDate);

      res.json({
        status: 'success',
        data: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          average_order_value: averageOrderValue,
          daily_statistics: dailyStatistics,
        },
      });
    } catch (error: any) {
      console.error('Get sales statistics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getRestaurantSales(req: AuthRequest, res: Response): Promise<void> {
    try {
      const restaurantId = req.query.restaurant_id ? parseInt(req.query.restaurant_id as string) : undefined;
      
      // SOA: Get all restaurants from Restaurant Service
      // Path: /restaurants (because restaurantRoutes is mounted at /restaurants)
      let allRestaurants: any[] = [];
      try {
        const restaurantsResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants`, {
          timeout: 5000,
        });
        if (restaurantsResponse.data.status === 'success') {
          allRestaurants = restaurantsResponse.data.data || [];
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      }

      // Get sales data from orders
      const sales = await OrderModel.getRestaurantSales(restaurantId);
      
      // Create a map of restaurant_id to sales data
      const salesMap = new Map<number, any>();
      sales.forEach((sale: any) => {
        salesMap.set(sale.restaurant_id, sale);
      });

      // Combine all restaurants with sales data (0 if no sales)
      const enrichedSales = allRestaurants.map((restaurant) => {
        const saleData = salesMap.get(restaurant.id);
        return {
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          total_orders: saleData ? (saleData.total_orders || 0) : 0,
          total_revenue: saleData ? (parseFloat(saleData.total_revenue) || 0) : 0,
          avg_order_value: saleData ? (parseFloat(saleData.avg_order_value) || 0) : 0,
        };
      });

      // Sort by total_revenue descending
      enrichedSales.sort((a, b) => b.total_revenue - a.total_revenue);

      res.json({
        status: 'success',
        data: enrichedSales,
      });
    } catch (error: any) {
      console.error('Get restaurant sales error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getAllOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const orders = await OrderModel.getAllOrders(limit, offset);

      // Enrich with restaurant, user, and driver details (SOA communication)
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // SOA: Get restaurant details
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            // SOA: Get customer details
            // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
            const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${order.user_id}`, {
              timeout: 5000,
            });
            const userName = userResponse.data.data.name;
            const userEmail = userResponse.data.data.email;

            // SOA: Get driver details if driver is assigned
            let driverName = null;
            let driverEmail = null;
            if (order.driver_id) {
              try {
                // Get driver from Driver Service
                // Path: /drivers/internal/drivers/:id (because driverRoutes is mounted at /drivers)
                const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/drivers/internal/drivers/${order.driver_id}`, {
                  timeout: 5000,
                });
                if (driverResponse.data.status === 'success' && driverResponse.data.data.user_id) {
                  // Get driver user details from User Service
                  const driverUserResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${driverResponse.data.data.user_id}`, {
                    timeout: 5000,
                  });
                  driverName = driverUserResponse.data.data.name;
                  driverEmail = driverUserResponse.data.data.email;
                }
              } catch (error) {
                console.error(`Failed to fetch driver details for driver_id ${order.driver_id}:`, error);
              }
            }

            return {
              order_id: order.id,
              restaurant_name: restaurantName,
              customer_name: userName,
              customer_email: userEmail,
              driver_id: order.driver_id,
              driver_name: driverName,
              driver_email: driverEmail,
              status: order.status,
              total_price: order.total_price,
              estimated_delivery_time: order.estimated_delivery_time,
              created_at: order.created_at,
            };
          } catch (error) {
            console.error(`Failed to enrich order ${order.id}:`, error);
            return {
              order_id: order.id,
              restaurant_name: 'Unknown',
              customer_name: 'Unknown',
              customer_email: 'Unknown',
              driver_id: order.driver_id,
              driver_name: null,
              driver_email: null,
              status: order.status,
              total_price: order.total_price,
              estimated_delivery_time: order.estimated_delivery_time,
              created_at: order.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const totalRevenue = await OrderModel.getTotalRevenue();
      const totalOrders = await OrderModel.getTotalOrders();
      const salesStatistics = await OrderModel.getSalesStatistics();
      const restaurantSales = await OrderModel.getRestaurantSales();

      res.json({
        status: 'success',
        data: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          sales_chart: salesStatistics,
          restaurant_sales: restaurantSales,
        },
      });
    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getDriverOrdersInternal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const driverId = parseInt(req.params.driverId);

      if (!driverId) {
        res.status(400).json({
          status: 'error',
          message: 'Driver ID is required',
        });
        return;
      }

      const orders = await OrderModel.findByDriverIdInternal(driverId);
      
      console.log(`🔍 SOA Debug - getDriverOrdersInternal for driverId ${driverId}:`);
      console.log(`   - Found ${orders.length} orders from database`);
      console.log(`   - Orders:`, orders.map(o => ({
        id: o.id,
        driver_id: o.driver_id,
        status: o.status,
        driver_id_match: o.driver_id === driverId
      })));

      // Enrich with restaurant details, customer details, and driver_id
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // SOA: Get restaurant details
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            // SOA: Get customer details
            // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
            let customerName = 'Unknown';
            try {
              const userResponse = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${order.user_id}`, {
                timeout: 5000,
              });
              customerName = userResponse.data.data.name || 'Unknown';
            } catch (error) {
              console.error('Failed to fetch customer name:', error);
            }

            const orderItems = await OrderModel.findItemsByOrderId(order.id);

            return {
              id: order.id,
              order_id: order.id,
              driver_id: order.driver_id ? Number(order.driver_id) : null, // Ensure driver_id is number for SOA communication
              customer_name: customerName,
              restaurant_name: restaurantName,
              status: order.status, // Status: ON_THE_WAY means driver has accepted
              total_price: order.total_price,
              items: orderItems.map((item) => ({
                name: item.menu_item_name,
                quantity: item.quantity,
                price: item.price,
              })),
              created_at: order.created_at,
            };
          } catch (error) {
            return {
              id: order.id,
              order_id: order.id,
              driver_id: order.driver_id ? Number(order.driver_id) : null, // Ensure driver_id is number
              customer_name: 'Unknown',
              restaurant_name: 'Unknown',
              status: order.status,
              total_price: order.total_price,
              items: [],
              created_at: order.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get driver orders internal error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getUserOrdersInternal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
        return;
      }

      const orders = await OrderModel.findByUserId(userId);

      // Enrich with restaurant names
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${order.restaurant_id}/menu`, {
              timeout: 5000,
            });
            const restaurantName = restaurantResponse.data.data.restaurant_name;

            const orderItems = await OrderModel.findItemsByOrderId(order.id);

            return {
              order_id: order.id,
              restaurant_name: restaurantName,
              status: order.status,
              total_price: order.total_price,
              items: orderItems.map((item) => ({
                name: item.menu_item_name,
                quantity: item.quantity,
                price: item.price,
              })),
              created_at: order.created_at,
            };
          } catch (error) {
            return {
              order_id: order.id,
              restaurant_name: 'Unknown',
              status: order.status,
              total_price: order.total_price,
              items: [],
              created_at: order.created_at,
            };
          }
        })
      );

      res.json({
        status: 'success',
        data: enrichedOrders,
      });
    } catch (error: any) {
      console.error('Get user orders internal error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint for payment service callback
  static async paymentCallback(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, payment_status } = req.body;

      if (!order_id || !payment_status) {
        res.status(400).json({
          status: 'error',
          message: 'order_id and payment_status are required',
        });
        return;
      }

      await OrderService.handlePaymentCallback(order_id, payment_status);

      res.json({
        status: 'success',
        message: 'Payment callback processed',
      });
    } catch (error: any) {
      console.error('Payment callback error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

