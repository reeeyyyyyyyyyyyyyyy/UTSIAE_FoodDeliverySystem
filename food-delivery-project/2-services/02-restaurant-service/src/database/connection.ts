// src/database/connection.ts

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { initializeDatabase } from './init-db'; // Impor fungsi inisialisasi

dotenv.config();

// Konfigurasi pool tetap sama
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_service_db', // Pastikan DB_NAME di .env sesuai
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Fungsi baru untuk menghubungkan DAN menginisialisasi database.
 * Kita akan await ini di index.ts SEBELUM server menyala.
 */
export async function connectToDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL database (${process.env.DB_NAME})`);
    
    // Sekarang kita TAHU koneksi berhasil, baru kita inisialisasi
    await initializeDatabase(pool); // Kirim 'pool' ke init-db
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    // Jika koneksi gagal, hentikan seluruh proses
    process.exit(1); 
  } finally {
    if (connection) connection.release();
  }
}

// Ekspor 'pool' agar bisa digunakan oleh controller
export default pool;