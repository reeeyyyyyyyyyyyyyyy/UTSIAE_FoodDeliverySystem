import pool from '../database/connection';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryTask {
  id: number;
  order_id: number;
  driver_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class DriverModel {
  static async findById(id: number): Promise<Driver | null> {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [id]);
    const drivers = rows as Driver[];
    return drivers.length > 0 ? drivers[0] : null;
  }

  static async findAvailable(): Promise<Driver[]> {
    const [rows] = await pool.execute("SELECT * FROM drivers WHERE status = 'AVAILABLE' LIMIT 1");
    return rows as Driver[];
  }

  static async updateStatus(id: number, status: string): Promise<Driver | null> {
    await pool.execute('UPDATE drivers SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
}

export class DeliveryTaskModel {
  static async create(orderId: number, driverId: number): Promise<DeliveryTask> {
    const [result] = await pool.execute('INSERT INTO delivery_tasks (order_id, driver_id, status) VALUES (?, ?, ?)', [
      orderId,
      driverId,
      'ASSIGNED',
    ]);
    const insertId = (result as any).insertId;
    return this.findById(insertId);
  }

  static async findById(id: number): Promise<DeliveryTask | null> {
    const [rows] = await pool.execute('SELECT * FROM delivery_tasks WHERE id = ?', [id]);
    const tasks = rows as DeliveryTask[];
    return tasks.length > 0 ? tasks[0] : null;
  }

  static async findByOrderId(orderId: number): Promise<DeliveryTask | null> {
    const [rows] = await pool.execute('SELECT * FROM delivery_tasks WHERE order_id = ?', [orderId]);
    const tasks = rows as DeliveryTask[];
    return tasks.length > 0 ? tasks[0] : null;
  }

  static async updateStatus(id: number, status: string): Promise<DeliveryTask | null> {
    await pool.execute('UPDATE delivery_tasks SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
}

