// src/database/migrate.ts
// Script untuk migrate/insert dummy data ke database

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'driver_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🚀 Starting migration for Driver Service...');

    // Ensure tables exist first
    console.log('📋 Checking/creating tables...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS driver_service_db`);
    await connection.query(`USE driver_service_db`);

    // Drop and recreate tables to ensure correct structure
    console.log('🔄 Recreating tables...');
    // Drop in correct order (child table first)
    await connection.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await connection.query(`DROP TABLE IF EXISTS driver_salaries`);
    await connection.query(`DROP TABLE IF EXISTS drivers`);
    await connection.query(`SET FOREIGN_KEY_CHECKS = 1`);

    await connection.query(`
      CREATE TABLE drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        vehicle_number VARCHAR(50) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        is_on_job BOOLEAN DEFAULT FALSE,
        total_earnings DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_is_available (is_available),
        INDEX idx_is_on_job (is_on_job)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE driver_salaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        base_salary DECIMAL(10, 2) NOT NULL,
        commission DECIMAL(10, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        total_earnings DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        INDEX idx_driver_id (driver_id),
        INDEX idx_month_year (month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tables created');

    // Clean existing data (optional - uncomment if you want to reset)
    // await connection.query('DELETE FROM driver_salaries');
    // await connection.query('DELETE FROM drivers');
    // console.log('✅ Cleaned existing data');

    // Clean existing driver data first
    console.log('🧹 Cleaning existing driver data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM driver_salaries');
    await connection.query('DELETE FROM drivers');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Insert driver data - get ALL users with role 'driver' from user_service_db
    // This follows SOA principle: Driver Service communicates with User Service
    console.log('📝 Fetching ALL driver users from User Service (SOA Communication)...');
    let driverUsers: Array<{ id: number; name: string; email: string; phone: string }> = [];
    try {
      // Query user_service_db directly to get ALL drivers with phone
      const [userRows] = await connection.query(`
        SELECT id, name, email, phone 
        FROM user_service_db.users 
        WHERE role = 'driver' 
        ORDER BY id ASC
      `) as any[];
      driverUsers = userRows || [];
      console.log(`📋 Found ${driverUsers.length} driver users in user_service_db`);
    } catch (error: any) {
      console.error('❌ Could not fetch from user_service_db:', error.message);
      console.warn('⚠️  Please ensure user_service_db exists and has driver users');
      driverUsers = [];
    }

    if (driverUsers.length === 0) {
      console.warn('⚠️  No driver users found. Skipping driver data insertion.');
    } else {
      console.log('📝 Inserting driver data for all drivers...');
      const vehicleTypes = ['Motor', 'Mobil', 'Motor', 'Mobil', 'Motor'];
      const vehicleNumbers = ['B1234XYZ', 'B5678ABC', 'B9999DEF', 'B8888GHI', 'B7777JKL'];
      const earnings = [500000.00, 750000.00, 600000.00, 550000.00, 650000.00];

      for (let i = 0; i < driverUsers.length; i++) {
        const user = driverUsers[i];
        const vehicleType = vehicleTypes[i % vehicleTypes.length];
        const vehicleNumber = vehicleNumbers[i % vehicleNumbers.length] || `B${1000 + i}ABC`;
        const earning = earnings[i % earnings.length] || 500000.00;
        
        try {
          // Check if driver with this user_id already exists
          const [existing] = await connection.query(
            'SELECT id FROM drivers WHERE user_id = ?',
            [user.id]
          ) as any[];
          
          if (existing && existing.length > 0) {
            console.log(`  ⚠️  Driver for user_id ${user.id} (${user.name}) already exists, skipping...`);
            continue;
          }
          
          await connection.query(`
            INSERT INTO drivers (user_id, vehicle_type, vehicle_number, is_available, is_on_job, total_earnings) 
            VALUES (?, ?, ?, TRUE, FALSE, ?)
          `, [user.id, vehicleType, vehicleNumber, earning]);
          console.log(`  ✅ Inserted driver for user_id ${user.id} (${user.name})`);
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`  ⚠️  Driver for user_id ${user.id} already exists (duplicate entry), skipping...`);
          } else {
            console.error(`  ❌ Error inserting driver for user_id ${user.id}:`, error.message);
          }
        }
      }
      console.log(`✅ Driver data inserted for ${driverUsers.length} drivers`);
    }

    // Step 1: Reset all driver total_earnings to 0 first (fresh start)
    console.log('📊 Resetting all driver total_earnings to 0.00 (fresh start)...');
    try {
      await connection.query('UPDATE drivers SET total_earnings = 0.00');
      console.log('  ✅ All driver earnings reset to 0.00');
    } catch (error: any) {
      console.warn('⚠️  Could not reset earnings:', error.message);
    }

    // Step 2: SOA: Calculate total_earnings from actual orders in order_service_db
    // Driver earns 20,000 per order (fixed rate, not based on order total_price)
    console.log('📊 Calculating driver total_earnings from Order Service (SOA)...');
    console.log('   Note: Driver earns Rp 20,000 per delivered order (fixed rate)');
    try {
      // Query order_service_db to get order count for each driver
      const [earningsRows] = await connection.query(`
        SELECT 
          driver_id,
          COUNT(*) as total_orders
        FROM order_service_db.orders
        WHERE driver_id IS NOT NULL 
          AND status = 'DELIVERED'
        GROUP BY driver_id
      `) as any[];

      if (earningsRows && earningsRows.length > 0) {
        const driverEarningPerOrder = 20000; // Fixed: 20rb per order
        const earningsMap = new Map<number, { total_orders: number; total_earnings: number }>();
        earningsRows.forEach((row: any) => {
          const totalOrders = row.total_orders || 0;
          const totalEarnings = totalOrders * driverEarningPerOrder; // 20rb per order
          earningsMap.set(row.driver_id, {
            total_orders: totalOrders,
            total_earnings: totalEarnings,
          });
        });

        // Update driver total_earnings based on actual orders
        const [allDrivers] = await connection.query('SELECT id FROM drivers') as any[];
        for (const driver of allDrivers) {
          const earnings = earningsMap.get(driver.id);
          if (earnings) {
            await connection.query(
              'UPDATE drivers SET total_earnings = ? WHERE id = ?',
              [earnings.total_earnings, driver.id]
            );
            console.log(`  ✅ Updated driver ${driver.id}: ${earnings.total_orders} orders × Rp 20,000 = Rp ${earnings.total_earnings.toLocaleString()}`);
          }
        }
        console.log('✅ Driver earnings updated from Order Service (20rb per order)');
      } else {
        console.log('  ℹ️  No delivered orders found. All drivers have total_earnings = 0.00');
      }
    } catch (error: any) {
      console.warn('⚠️  Could not calculate earnings from order_service_db:', error.message);
      console.warn('   All drivers will have total_earnings = 0.00 (fresh start)');
    }

    // Note: Driver salaries are created by admin via API, not during migration
    // This follows SOA principle: salaries are calculated from actual orders when created
    console.log('ℹ️  Driver salaries will be created by admin via API (uses real order data)');

    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Duplicate entry detected. Data may already exist.');
    } else {
      throw error;
    }
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

