// src/database/init-db.ts

import fs from 'fs';
import path from 'path';
import { Pool } from 'mysql2/promise'; // Impor tipe Pool

// Terima 'pool' sebagai argumen
export async function initializeDatabase(pool: Pool) {
  const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
  // Remove single-line comments before splitting
  const cleanedSql = initSql.replace(/--.*$/gm, '').trim();
  const statements = cleanedSql.split(';').filter(stmt => stmt.trim().length > 0);

  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`🚀 Initializing database (${process.env.DB_NAME || 'driver_service_db'})...`);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.toLowerCase().startsWith('use ')) {
        try {
          await connection.query(trimmed);
        } catch (error: any) {
          // Ignore table exists errors and duplicate key errors
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_ENTRY' || 
              error.code === 'ER_DUP_KEYNAME') {
            // Table or data already exists, skip
            continue;
          }
          throw error;
        }
      }
    }
    
    console.log('✅ Database initialized successfully.');
  } catch (error: any) {
    // Abaikan error jika tabel sudah ada
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
        error.code === 'ER_DUP_ENTRY' || 
        error.code === 'ER_DUP_KEYNAME') {
      console.warn('⚠️  Tables or data already exist. Skipping creation.');
    } else {
      console.error('❌ Database initialization error:', error.message);
      throw error; // Lemparkan error agar koneksi gagal
    }
  } finally {
    if (connection) connection.release();
  }
}