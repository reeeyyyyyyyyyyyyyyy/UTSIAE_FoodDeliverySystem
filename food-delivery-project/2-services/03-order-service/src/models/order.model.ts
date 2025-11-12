import pool from '../database/connection';

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  address_id: number;
  status: string;
  total_price: number;
  payment_id: number | null;
  driver_id: number | null;
  estimated_delivery_time: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  price: number;
  created_at: Date;
}

export interface OrderInput {
  restaurant_id: number;
  address_id: number;
  items: Array<{
    menu_item_id: number;
    quantity: number;
  }>;
}

export class OrderModel {
  static async create(orderData: Partial<Order>, items: Array<{ menu_item_id: number; menu_item_name: string; quantity: number; price: number }>): Promise<Order> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (user_id, restaurant_id, address_id, status, total_price, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          orderData.user_id,
          orderData.restaurant_id,
          orderData.address_id,
          orderData.status || 'PENDING_PAYMENT',
          orderData.total_price,
          orderData.payment_id || null,
        ]
      );
      const orderId = (orderResult as any).insertId;

      // Insert order items
      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.menu_item_name, item.quantity, item.price]
        );
      }

      await connection.commit();
      return this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id: number): Promise<Order | null> {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    const orders = rows as Order[];
    return orders.length > 0 ? orders[0] : null;
  }

  static async findByUserId(userId: number): Promise<Order[]> {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows as Order[];
  }

  static async findByStatus(status: string): Promise<Order[]> {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE status = ? ORDER BY created_at ASC', [status]);
    return rows as Order[];
  }

  static async findByDriverId(driverId: number): Promise<Order[]> {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE driver_id = ? ORDER BY created_at DESC', [driverId]);
    return rows as Order[];
  }

  static async findItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    const [rows] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    return rows as OrderItem[];
  }

  static async updateStatus(id: number, status: string, driverId?: number, estimatedDeliveryTime?: Date): Promise<Order | null> {
    if (driverId !== undefined && estimatedDeliveryTime) {
      await pool.execute('UPDATE orders SET status = ?, driver_id = ?, estimated_delivery_time = ? WHERE id = ?', [
        status,
        driverId,
        estimatedDeliveryTime,
        id,
      ]);
    } else if (driverId !== undefined) {
      await pool.execute('UPDATE orders SET status = ?, driver_id = ? WHERE id = ?', [status, driverId, id]);
    } else {
      await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }
    return this.findById(id);
  }

  static async updatePaymentId(id: number, paymentId: number): Promise<Order | null> {
    await pool.execute('UPDATE orders SET payment_id = ? WHERE id = ?', [paymentId, id]);
    return this.findById(id);
  }
}

