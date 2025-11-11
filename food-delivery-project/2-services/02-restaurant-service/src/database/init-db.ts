// src/database/init-db.ts

import fs from 'fs';
import path from 'path';
import { Pool } from 'mysql2/promise'; // Impor tipe Pool

// Terima 'pool' sebagai argumen
export async function initializeDatabase(pool: Pool) {
  const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
  const statements = initSql.split(';').filter(Boolean); // Pisahkan query

  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`🚀 Initializing database (${process.env.DB_NAME})...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (error: any) {
          // Abaikan error jika tabel sudah ada atau data sudah ada
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_ENTRY' ||
              error.code === 'ER_DUP_KEYNAME') {
            console.warn(`⚠️  ${error.code}: Skipping - ${statement.substring(0, 50)}...`);
          } else {
            // Log error tapi lanjutkan untuk INSERT statements
            if (statement.trim().toUpperCase().startsWith('INSERT')) {
              console.warn(`⚠️  Insert warning: ${error.message}`);
            } else {
              throw error;
            }
          }
        }
      }
    }
    
    console.log('✅ Database initialized successfully.');
  } catch (error: any) {
    // Abaikan error jika tabel sudah ada
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.warn('⚠️  Tables already exist. Skipping creation.');
    } else {
      console.error('❌ Database initialization error:', error.message);
      throw error; // Lemparkan error agar koneksi gagal
    }
  } finally {
    if (connection) connection.release();
  }
}