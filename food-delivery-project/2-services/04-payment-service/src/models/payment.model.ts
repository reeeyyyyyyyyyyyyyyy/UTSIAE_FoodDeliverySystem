import pool from '../database/connection';

export interface Payment {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentInput {
  order_id: number;
  user_id: number;
  amount: number;
  payment_method?: string;
}

export class PaymentModel {
  static async create(paymentData: PaymentInput): Promise<Payment> {
    const [result] = await pool.execute(
      'INSERT INTO payments (order_id, user_id, amount, status, payment_method) VALUES (?, ?, ?, ?, ?)',
      [paymentData.order_id, paymentData.user_id, paymentData.amount, 'PENDING', paymentData.payment_method || null]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId);
  }

  static async findById(id: number): Promise<Payment | null> {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);
    const payments = rows as Payment[];
    return payments.length > 0 ? payments[0] : null;
  }

  static async findByOrderId(orderId: number): Promise<Payment | null> {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    const payments = rows as Payment[];
    return payments.length > 0 ? payments[0] : null;
  }

  static async updateStatus(id: number, status: string): Promise<Payment | null> {
    await pool.execute('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
}

