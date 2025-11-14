import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3308'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrateFresh() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🧹 Starting migrate:fresh for Restaurant Service...');
    console.log('✅ Connected to database');

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS restaurant_service_db`);
    await connection.query(`USE restaurant_service_db`);

    // Drop all tables (fresh start)
    console.log('🗑️  Dropping all tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS menu_items');
    await connection.query('DROP TABLE IF EXISTS restaurants');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Read and execute init.sql
    console.log('📝 Reading init.sql...');
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf-8');
    const cleanedSql = initSql.replace(/--.*$/gm, '').trim();
    const statements = cleanedSql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log('🚀 Executing init.sql statements...');
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith('use ')) {
        continue;
      }
      
      try {
        await connection.query(trimmed);
      } catch (error: any) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_ENTRY' ||
            error.code === 'ER_DUP_KEYNAME') {
          continue;
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2' && trimmed.toUpperCase().startsWith('INSERT')) {
          console.warn(`⚠️  Foreign key constraint: ${error.message.substring(0, 100)}`);
          continue;
        } else if (trimmed.toUpperCase().startsWith('INSERT')) {
          console.warn(`⚠️  Insert warning: ${error.message.substring(0, 100)}`);
          continue;
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migrate fresh completed successfully!');
    console.log('📊 Database initialized with 15 restaurants and menus');
  } catch (error: any) {
    console.error('❌ Migrate fresh error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

migrateFresh();

