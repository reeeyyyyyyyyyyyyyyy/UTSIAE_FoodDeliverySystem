import pool from '../database/connection';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  full_address: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AddressInput {
  label: string;
  full_address: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export class UserModel {
  static async create(userData: UserInput): Promise<User> {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [userData.name, userData.email, userData.password, userData.phone || null]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId);
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async update(id: number, userData: Partial<UserInput>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.name) {
      updates.push('name = ?');
      values.push(userData.name);
    }
    if (userData.email) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password) {
      updates.push('password = ?');
      values.push(userData.password);
    }
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(userData.phone);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
}

export class AddressModel {
  static async create(userId: number, addressData: AddressInput): Promise<Address> {
    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await pool.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    }

    const [result] = await pool.execute(
      'INSERT INTO addresses (user_id, label, full_address, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        addressData.label,
        addressData.full_address,
        addressData.latitude || null,
        addressData.longitude || null,
        addressData.is_default || false,
      ]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId);
  }

  static async findById(id: number): Promise<Address | null> {
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [id]);
    const addresses = rows as Address[];
    return addresses.length > 0 ? addresses[0] : null;
  }

  static async findByUserId(userId: number): Promise<Address[]> {
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
    return rows as Address[];
  }

  static async update(id: number, userId: number, addressData: Partial<AddressInput>): Promise<Address | null> {
    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await pool.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND id != ?', [userId, id]);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (addressData.label) {
      updates.push('label = ?');
      values.push(addressData.label);
    }
    if (addressData.full_address) {
      updates.push('full_address = ?');
      values.push(addressData.full_address);
    }
    if (addressData.latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(addressData.latitude);
    }
    if (addressData.longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(addressData.longitude);
    }
    if (addressData.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(addressData.is_default);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    return (result as any).affectedRows > 0;
  }
}

