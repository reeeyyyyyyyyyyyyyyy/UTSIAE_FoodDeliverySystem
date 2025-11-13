import axios from 'axios';
import dotenv from 'dotenv';
import { OrderModel, OrderInput, OrderItem } from '../models/order.model';

dotenv.config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://localhost:3005';

export class OrderService {
  static async validateUser(userId: number): Promise<any> {
    try {
      // SOA Communication: Order Service calls User Service to validate user
      // Path: /users/internal/users/:id (because userRoutes is mounted at /users)
      const response = await axios.get(`${USER_SERVICE_URL}/users/internal/users/${userId}`, {
        timeout: 5000,
      });
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response from User Service');
      }
      return response.data.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Failed to validate user: ${error.message}`);
    }
  }

  static async validateRestaurantAndMenu(restaurantId: number, items: Array<{ menu_item_id: number; quantity: number }>): Promise<{ restaurant: any; menuItems: any[] }> {
    try {
      // Get restaurant menu (SOA: Order Service calls Restaurant Service)
      // Path: /restaurants/:id/menu (because restaurantRoutes is mounted at /restaurants)
      const menuResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${restaurantId}/menu`, {
        timeout: 5000,
      });
      const menuData = menuResponse.data.data;
      const restaurant = { name: menuData.restaurant_name, id: restaurantId };

      // Check stock (SOA: Order Service calls Restaurant Service internal endpoint)
      // Path: /restaurants/internal/menu-items/check (because restaurantRoutes is mounted at /restaurants)
      const stockCheckResponse = await axios.post(`${RESTAURANT_SERVICE_URL}/restaurants/internal/menu-items/check`, { items }, {
        timeout: 5000,
      });
      if (stockCheckResponse.data.status !== 'success') {
        throw new Error(stockCheckResponse.data.message || 'Stock check failed');
      }

      // Get menu items details
      const menuItems = menuData.menu_items.filter((item: any) =>
        items.some((orderItem) => orderItem.menu_item_id === item.id)
      );

      return { restaurant, menuItems };
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to validate restaurant and menu');
      }
      throw new Error(`Failed to validate restaurant and menu: ${error.message}`);
    }
  }

  static async createPayment(orderId: number, totalPrice: number, userId: number): Promise<number> {
    try {
      const response = await axios.post(`${PAYMENT_SERVICE_URL}/internal/payments`, {
        order_id: orderId,
        user_id: userId,
        amount: totalPrice,
      });
      return response.data.data.payment_id;
    } catch (error: any) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  static async decreaseStock(items: Array<{ menu_item_id: number; quantity: number }>): Promise<void> {
    try {
      // SOA: Order Service calls Restaurant Service internal endpoint
      // Path: /restaurants/internal/menu-items/decrease-stock (because restaurantRoutes is mounted at /restaurants)
      await axios.post(`${RESTAURANT_SERVICE_URL}/restaurants/internal/menu-items/decrease-stock`, { items }, {
        timeout: 5000,
      });
    } catch (error: any) {
      throw new Error(`Failed to decrease stock: ${error.message}`);
    }
  }

  static async createOrder(userId: number, orderData: OrderInput): Promise<{ order: any; paymentId: number }> {
    // Step 1: Validate user
    await this.validateUser(userId);

    // Step 2: Validate restaurant and menu, check stock
    const { restaurant, menuItems } = await this.validateRestaurantAndMenu(orderData.restaurant_id, orderData.items);

    // Step 3: Calculate total price
    let totalPrice = 0;
    const orderItems: Array<{ menu_item_id: number; menu_item_name: string; quantity: number; price: number }> = [];

    for (const item of orderData.items) {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }
      const itemTotal = menuItem.price * item.quantity;
      totalPrice += itemTotal;
      orderItems.push({
        menu_item_id: item.menu_item_id,
        menu_item_name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    // Step 4: Create order in database
    const order = await OrderModel.create(
      {
        user_id: userId,
        restaurant_id: orderData.restaurant_id,
        address_id: orderData.address_id,
        status: 'PENDING_PAYMENT',
        total_price: totalPrice,
      },
      orderItems
    );

    // Step 5: Create payment
    const paymentId = await this.createPayment(order.id, totalPrice, userId);

    // Step 6: Update order with payment_id
    await OrderModel.updatePaymentId(order.id, paymentId);

    // NOTE: Stock will be decreased after payment success in handlePaymentCallback
    // This ensures stock is only reduced when payment is confirmed (SOA principle)

    return { order, paymentId };
  }

  static async handlePaymentCallback(orderId: number, paymentStatus: string): Promise<void> {
    if (paymentStatus === 'SUCCESS') {
      // Step 1: Get order to get items for stock decrease
      const order = await OrderModel.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Step 2: Get order items to decrease stock
      const orderItems = await OrderModel.findItemsByOrderId(orderId);
      const itemsToDecrease = orderItems.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      // Step 3: Decrease stock (SOA: Order Service calls Restaurant Service)
      await this.decreaseStock(itemsToDecrease);

      // Step 4: Update order status to PREPARING (so it appears in driver dashboard)
      await OrderModel.updateStatus(orderId, 'PREPARING');

      // Step 5: Order will be available for drivers to accept
      // Drivers can see orders with status 'PREPARING' in their dashboard
      // Admin can track which driver accepts the order
    } else {
      // Payment failed, update order status
      await OrderModel.updateStatus(orderId, 'PAYMENT_FAILED');
    }
  }

  static async assignDriver(orderId: number, driverId: number, estimatedDeliveryTime: Date): Promise<void> {
    await OrderModel.updateStatus(orderId, 'ON_THE_WAY', driverId, estimatedDeliveryTime);
  }

  static async updateOrderStatus(orderId: number, status: string): Promise<void> {
    await OrderModel.updateStatus(orderId, status);
  }
}

