import pool from '../database/connection';

export interface Driver {
  id: number;
  user_id: number;
  vehicle_type: string;
  vehicle_number: string;
  is_available: boolean;
  is_on_job: boolean;
  total_earnings: number;
  created_at: Date;
  updated_at: Date;
}

export interface DriverSalary {
  id: number;
  driver_id: number;
  month: number;
  year: number;
  base_salary: number;
  commission: number;
  total_orders: number;
  total_earnings: number;
  status: string; // PENDING, PAID
  created_at: Date;
  updated_at: Date;
}

export class DriverModel {
  static async findById(id: number): Promise<Driver | null> {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [id]);
    const drivers = rows as Driver[];
    return drivers.length > 0 ? drivers[0] : null;
  }

  static async findByUserId(userId: number): Promise<Driver | null> {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE user_id = ?', [userId]);
    const drivers = rows as Driver[];
    return drivers.length > 0 ? drivers[0] : null;
  }

  static async findAll(): Promise<Driver[]> {
    const [rows] = await pool.execute('SELECT * FROM drivers ORDER BY created_at DESC');
    return rows as Driver[];
  }

  static async findAvailable(): Promise<Driver[]> {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE is_available = TRUE AND is_on_job = FALSE');
    return rows as Driver[];
  }

  static async findOnJob(): Promise<Driver[]> {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE is_on_job = TRUE');
    return rows as Driver[];
  }

  static async updateStatus(driverId: number, isOnJob: boolean): Promise<Driver | null> {
    await pool.execute('UPDATE drivers SET is_on_job = ? WHERE id = ?', [isOnJob, driverId]);
    return this.findById(driverId);
  }

  static async updateEarnings(driverId: number, amount: number): Promise<Driver | null> {
    await pool.execute('UPDATE drivers SET total_earnings = total_earnings + ? WHERE id = ?', [amount, driverId]);
    return this.findById(driverId);
  }
}

export class DriverSalaryModel {
  static async create(salaryData: { driver_id: number; month: number; year: number; base_salary: number; commission: number; total_orders: number; total_earnings: number }): Promise<DriverSalary> {
    const [result] = await pool.execute(
      'INSERT INTO driver_salaries (driver_id, month, year, base_salary, commission, total_orders, total_earnings, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [salaryData.driver_id, salaryData.month, salaryData.year, salaryData.base_salary, salaryData.commission, salaryData.total_orders, salaryData.total_earnings, 'PENDING']
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId);
  }

  static async findById(id: number): Promise<DriverSalary | null> {
    const [rows] = await pool.execute('SELECT * FROM driver_salaries WHERE id = ?', [id]);
    const salaries = rows as DriverSalary[];
    return salaries.length > 0 ? salaries[0] : null;
  }

  static async findByDriverId(driverId: number): Promise<DriverSalary[]> {
    const [rows] = await pool.execute('SELECT * FROM driver_salaries WHERE driver_id = ? ORDER BY year DESC, month DESC', [driverId]);
    return rows as DriverSalary[];
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<DriverSalary[]> {
    const [rows] = await pool.execute('SELECT * FROM driver_salaries ORDER BY year DESC, month DESC, driver_id ASC LIMIT ? OFFSET ?', [limit, offset]);
    return rows as DriverSalary[];
  }

  static async updateStatus(id: number, status: string): Promise<DriverSalary | null> {
    await pool.execute('UPDATE driver_salaries SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
}
