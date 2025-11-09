import { Request, Response } from 'express';
import { OrderModel, OrderInput } from '../models/order.model';
import { OrderService } from '../services/order.service';
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
            const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/${order.restaurant_id}/menu`);
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

      // Get restaurant details
      let restaurantDetails = { name: 'Unknown', address: 'Unknown' };
      try {
        const restaurantResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/${order.restaurant_id}/menu`);
        const restaurantData = restaurantResponse.data.data;
        const restaurantInfo = await axios.get(`${RESTAURANT_SERVICE_URL}/`);
        const restaurants = restaurantInfo.data.data;
        const restaurant = restaurants.find((r: any) => r.id === order.restaurant_id);
        if (restaurant) {
          restaurantDetails = { name: restaurant.name, address: restaurant.address };
        }
      } catch (error) {
        console.error('Failed to fetch restaurant details:', error);
      }

      // Get user address
      let deliveryAddress = 'Unknown';
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users/${userId}`);
        const addressesResponse = await axios.get(`${USER_SERVICE_URL}/addresses`, {
          headers: { Authorization: req.headers.authorization },
        });
        const addresses = addressesResponse.data.data;
        const address = addresses.find((a: any) => a.id === order.address_id);
        if (address) {
          deliveryAddress = address.full_address;
        }
      } catch (error) {
        console.error('Failed to fetch address:', error);
      }

      // Get driver details if order is assigned
      let driverDetails = null;
      if (order.driver_id) {
        try {
          const driverResponse = await axios.get(`${DRIVER_SERVICE_URL}/internal/drivers/${order.driver_id}`);
          driverDetails = driverResponse.data.data;
        } catch (error) {
          console.error('Failed to fetch driver details:', error);
        }
      }

      res.json({
        status: 'success',
        data: {
          order_id: order.id,
          status: order.status,
          restaurant_details: restaurantDetails,
          delivery_address: deliveryAddress,
          driver_details: driverDetails,
          items: orderItems.map((item) => ({
            name: item.menu_item_name,
            quantity: item.quantity,
            price: item.price,
          })),
          total_price: order.total_price,
          estimated_delivery: order.estimated_delivery_time,
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

