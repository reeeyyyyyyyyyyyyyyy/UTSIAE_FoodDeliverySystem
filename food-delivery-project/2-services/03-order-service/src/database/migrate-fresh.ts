// src/database/migrate-fresh.ts
// Script to clean and reinitialize Order Service database (like Laravel migrate:fresh)

import pool from './connection';
import fs from 'fs';
import path from 'path';

async function migrateFresh() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🔄 Starting migrate:fresh for Order Service...');

    // Step 1: Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Step 2: Drop all tables
    console.log('🗑️  Dropping all tables...');
    await connection.query('DROP TABLE IF EXISTS order_items');
    await connection.query('DROP TABLE IF EXISTS orders');
    
    // Step 3: Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Step 4: Recreate tables from init.sql
    console.log('📦 Recreating tables...');
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    const statements = initSql.split(';').filter(Boolean);

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ migrate:fresh completed successfully!');
    console.log('   - All tables dropped and recreated');
    console.log('   - Database is now clean and ready for new data');
  } catch (error: any) {
    console.error('❌ migrate:fresh error:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrateFresh()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateFresh };

