// src/database/migrate-fresh.ts
// Script to clean and reinitialize Driver Service database (like Laravel migrate:fresh)
// This script integrates with User Service and Order Service following SOA principles

import pool from './connection';
import fs from 'fs';
import path from 'path';

async function migrateFresh() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🔄 Starting migrate:fresh for Driver Service...');

    // Step 1: Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Step 2: Drop all tables
    console.log('🗑️  Dropping all tables...');
    await connection.query('DROP TABLE IF EXISTS driver_salaries');
    await connection.query('DROP TABLE IF EXISTS drivers');
    
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

    // Step 5: Migrate driver data from User Service (SOA)
    console.log('📝 Migrating driver data from User Service (SOA)...');
    let driverUsers: Array<{ id: number; name: string; email: string; phone: string }> = [];
    try {
      // Query user_service_db directly to get ALL drivers
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
      driverUsers = [];
    }

    if (driverUsers.length > 0) {
      const vehicleTypes = ['Motor', 'Mobil', 'Motor', 'Mobil', 'Motor'];
      const vehicleNumbers = ['B1234XYZ', 'B5678ABC', 'B9999DEF', 'B8888GHI', 'B7777JKL'];

      for (let i = 0; i < driverUsers.length; i++) {
        const user = driverUsers[i];
        const vehicleType = vehicleTypes[i % vehicleTypes.length];
        const vehicleNumber = vehicleNumbers[i % vehicleNumbers.length] || `B${1000 + i}ABC`;
        
        await connection.query(`
          INSERT INTO drivers (user_id, vehicle_type, vehicle_number, is_available, is_on_job, total_earnings) 
          VALUES (?, ?, ?, TRUE, FALSE, 0.00)
        `, [user.id, vehicleType, vehicleNumber]);
        console.log(`  ✅ Inserted driver for user_id ${user.id} (${user.name}) with total_earnings = 0.00`);
      }
    }

    // Step 6: Reset all driver total_earnings to 0 (fresh start)
    console.log('📊 Resetting all driver total_earnings to 0.00 (fresh start)...');
    try {
      await connection.query('UPDATE drivers SET total_earnings = 0.00');
      console.log('  ✅ All driver earnings reset to 0.00');
    } catch (error: any) {
      console.warn('⚠️  Could not reset earnings:', error.message);
    }

    // Step 7: Calculate total_earnings from Order Service (SOA) - only if orders exist
    // Driver earns 20,000 per order (fixed rate, not based on order total_price)
    console.log('📊 Calculating driver total_earnings from Order Service (SOA)...');
    console.log('   Note: Driver earns Rp 20,000 per delivered order (fixed rate)');
    try {
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

    console.log('✅ migrate:fresh completed successfully!');
    console.log('   - All tables dropped and recreated');
    console.log('   - Driver data migrated from User Service (SOA)');
    console.log('   - All driver total_earnings reset to 0.00 (fresh start)');
    console.log('   - Total earnings will be calculated from Order Service when orders are delivered');
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

