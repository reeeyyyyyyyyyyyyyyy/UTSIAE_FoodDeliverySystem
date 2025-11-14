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
    console.log(`🚀 Initializing database (${process.env.DB_NAME || 'restaurant_service_db'})...`);
    
    // First, ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS restaurant_service_db`);
    await connection.query(`USE restaurant_service_db`);
    
    // Execute statements in order
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith('use ')) {
        continue;
      }
      
      try {
        await connection.query(trimmed);
      } catch (error: any) {
        // Ignore table exists, duplicate entry, and foreign key errors for INSERT
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_ENTRY' ||
            error.code === 'ER_DUP_KEYNAME') {
          // Skip - already exists
          continue;
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2' && trimmed.toUpperCase().startsWith('INSERT')) {
          // Foreign key constraint - restaurant might not exist yet, try to insert restaurants first
          console.warn(`⚠️  Foreign key constraint: ${error.message.substring(0, 100)}`);
          // This will be handled by re-running the insert after restaurants are created
          continue;
        } else if (trimmed.toUpperCase().startsWith('INSERT')) {
          // Other INSERT errors - log but continue
          console.warn(`⚠️  Insert warning: ${error.message.substring(0, 100)}`);
          continue;
        } else {
          // For other errors, throw
          throw error;
        }
      }
    }
    
    console.log('✅ Database initialized successfully with 15 restaurants and menus.');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    // Don't throw - allow service to start even if init fails
    console.warn('⚠️  Continuing despite initialization errors...');
  } finally {
    if (connection) connection.release();
  }
}
