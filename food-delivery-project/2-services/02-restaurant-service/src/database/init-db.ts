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
    
    // Now ensure restaurants exist before menu items
    // Get or create restaurants
    const restaurants = [
      { name: 'Sate Padang Asli', cuisine_type: 'Padang', address: 'Jl. Cihampelas No. 20', image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
      { name: 'Warung Nasi Sunda', cuisine_type: 'Sunda', address: 'Jl. Setiabudi No. 50', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
      { name: 'Bakso Malang Cak Kar', cuisine_type: 'Jawa', address: 'Jl. Dago No. 100', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400' }
    ];
    
    const restaurantMap = new Map<string, number>();
    
    for (const restaurant of restaurants) {
      try {
        // Try to get existing restaurant
        const [existing] = await connection.query(
          'SELECT id FROM restaurants WHERE name = ? AND address = ?',
          [restaurant.name, restaurant.address]
        ) as any[];
        
        if (existing && existing.length > 0) {
          restaurantMap.set(restaurant.name, existing[0].id);
        } else {
          // Insert new restaurant
          const [result] = await connection.query(
            'INSERT INTO restaurants (name, cuisine_type, address, is_open, image_url) VALUES (?, ?, ?, ?, ?)',
            [restaurant.name, restaurant.cuisine_type, restaurant.address, true, restaurant.image_url]
          ) as any[];
          restaurantMap.set(restaurant.name, result.insertId);
        }
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          // Get existing ID
          const [existing] = await connection.query(
            'SELECT id FROM restaurants WHERE name = ? AND address = ?',
            [restaurant.name, restaurant.address]
          ) as any[];
          if (existing && existing.length > 0) {
            restaurantMap.set(restaurant.name, existing[0].id);
          }
        } else {
          console.warn(`⚠️  Error inserting restaurant ${restaurant.name}: ${error.message}`);
        }
      }
    }
    
    // Now insert menu items with correct restaurant_id
    const menuItems = [
      { restaurant: 'Sate Padang Asli', name: 'Sate Padang (Daging)', description: 'Sate daging sapi dengan kuah kuning kental.', price: 25000, stock: 50, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300' },
      { restaurant: 'Sate Padang Asli', name: 'Sate Padang (Lidah)', description: 'Sate lidah sapi dengan kuah kuning kental.', price: 27000, stock: 30, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300' },
      { restaurant: 'Sate Padang Asli', name: 'Rendang', description: 'Rendang daging sapi dengan bumbu rempah yang kaya.', price: 35000, stock: 40, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300' },
      { restaurant: 'Sate Padang Asli', name: 'Es Teh Manis', description: 'Es teh manis segar.', price: 5000, stock: 100, category: 'Minuman', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300' },
      { restaurant: 'Warung Nasi Sunda', name: 'Nasi Liwet', description: 'Nasi liwet dengan lauk pauk khas Sunda.', price: 20000, stock: 60, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' },
      { restaurant: 'Warung Nasi Sunda', name: 'Ayam Goreng', description: 'Ayam goreng krispi dengan sambal terasi.', price: 22000, stock: 45, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' },
      { restaurant: 'Warung Nasi Sunda', name: 'Kerupuk', description: 'Kerupuk renyah.', price: 3000, stock: 200, category: 'Jajanan', image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300' },
      { restaurant: 'Warung Nasi Sunda', name: 'Es Jeruk', description: 'Es jeruk peras segar.', price: 6000, stock: 100, category: 'Minuman', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300' },
      { restaurant: 'Bakso Malang Cak Kar', name: 'Bakso Malang', description: 'Bakso urat dengan mie dan siomay.', price: 18000, stock: 70, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
      { restaurant: 'Bakso Malang Cak Kar', name: 'Bakso Bakar', description: 'Bakso bakar dengan bumbu kecap manis.', price: 20000, stock: 50, category: 'Makanan', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
      { restaurant: 'Bakso Malang Cak Kar', name: 'Kerupuk Bakso', description: 'Kerupuk untuk bakso.', price: 2000, stock: 150, category: 'Add On', image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300' },
      { restaurant: 'Bakso Malang Cak Kar', name: 'Es Campur', description: 'Es campur dengan berbagai topping.', price: 8000, stock: 80, category: 'Minuman', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300' }
    ];
    
    for (const item of menuItems) {
      const restaurantId = restaurantMap.get(item.restaurant);
      if (!restaurantId) {
        console.warn(`⚠️  Restaurant "${item.restaurant}" not found, skipping menu item "${item.name}"`);
        continue;
      }
      
      try {
        await connection.query(
          'INSERT IGNORE INTO menu_items (restaurant_id, name, description, price, stock, is_available, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [restaurantId, item.name, item.description, item.price, item.stock, true, item.category, item.image_url]
        );
      } catch (error: any) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.warn(`⚠️  Error inserting menu item ${item.name}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Database initialized successfully.');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    // Don't throw - allow service to start even if init fails
    console.warn('⚠️  Continuing despite initialization errors...');
  } finally {
    if (connection) connection.release();
  }
}