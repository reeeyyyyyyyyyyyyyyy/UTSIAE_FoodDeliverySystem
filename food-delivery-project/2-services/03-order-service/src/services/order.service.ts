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
      const response = await axios.get(`${USER_SERVICE_URL}/internal/users/${userId}`);
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
      // Get restaurant menu
      const menuResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/${restaurantId}/menu`);
      const menuData = menuResponse.data.data;
      const restaurant = { name: menuData.restaurant_name, id: restaurantId };

      // Check stock
      const stockCheckResponse = await axios.post(`${RESTAURANT_SERVICE_URL}/internal/menu-items/check`, { items });
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
      await axios.post(`${RESTAURANT_SERVICE_URL}/internal/menu-items/decrease-stock`, { items });
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

    // Step 7: Decrease stock (after payment is created)
    await this.decreaseStock(orderData.items);

    return { order, paymentId };
  }

  static async handlePaymentCallback(orderId: number, paymentStatus: string): Promise<void> {
    if (paymentStatus === 'SUCCESS') {
      // Update order status to PAID
      await OrderModel.updateStatus(orderId, 'PAID');

      // Trigger driver assignment
      try {
        const driverResponse = await axios.post(`${DRIVER_SERVICE_URL}/internal/drivers/assign`, {
          order_id: orderId,
        });
        
        if (driverResponse.data.status === 'success') {
          const driver = driverResponse.data.data;
          // Calculate estimated delivery time (30 minutes from now)
          const estimatedDeliveryTime = new Date();
          estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);
          
          // Update order with driver and estimated delivery time
          await OrderModel.updateStatus(orderId, 'PREPARING', driver.id || driver.driver_id, estimatedDeliveryTime);
          
          // After a delay, update to ON_THE_WAY (simulating preparation time)
          setTimeout(async () => {
            await OrderModel.updateStatus(orderId, 'ON_THE_WAY');
          }, 5000); // 5 seconds delay for demo
        }
      } catch (error: any) {
        console.error('Failed to assign driver:', error.message);
        // If driver assignment fails, set status to PREPARING
        await OrderModel.updateStatus(orderId, 'PREPARING');
      }
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

