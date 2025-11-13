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

  static async findRecentOrdersByUser(userId: number, restaurantId: number, seconds: number): Promise<Order[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? AND restaurant_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND) ORDER BY created_at DESC',
      [userId, restaurantId, seconds]
    );
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

  static async findByDriverIdInternal(driverId: number): Promise<Order[]> {
    // Only return active orders (ON_THE_WAY, PREPARING) for the driver
    // This ensures SOA communication returns only relevant active orders
    // IMPORTANT: driver_id must match exactly (not NULL, not different driver)
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE driver_id = ? AND status IN (?, ?) ORDER BY created_at DESC',
      [driverId, 'ON_THE_WAY', 'PREPARING']
    );
    const orders = rows as Order[];
    console.log(`📊 OrderModel.findByDriverIdInternal(driverId=${driverId}): Found ${orders.length} active orders`);
    return orders;
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

  // Admin statistics methods
  static async getSalesStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE status IN ('DELIVERED', 'PREPARING', 'ON_THE_WAY', 'PAID')
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getRestaurantSales(restaurantId?: number): Promise<any> {
    // Include all orders (not just DELIVERED) to show all sales data
    let query = `
      SELECT 
        restaurant_id,
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE status IN ('DELIVERED', 'PREPARING', 'ON_THE_WAY', 'PAID', 'PENDING_PAYMENT')
    `;
    const params: any[] = [];

    if (restaurantId) {
      query += ' AND restaurant_id = ?';
      params.push(restaurantId);
    }

    query += ' GROUP BY restaurant_id ORDER BY total_revenue DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getAllOrders(limit: number = 100, offset: number = 0): Promise<Order[]> {
    const [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rows as Order[];
  }

  static async getTotalRevenue(): Promise<number> {
    // Include all orders (not just DELIVERED) for total revenue calculation
    const [rows] = await pool.execute("SELECT SUM(total_price) as total FROM orders");
    const result = rows as any[];
    return result[0]?.total || 0;
  }

  static async getTotalOrders(): Promise<number> {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM orders');
    const result = rows as any[];
    return result[0]?.total || 0;
  }
}

