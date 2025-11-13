import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🚀 Starting migration for Restaurant Service...');
    console.log('✅ Connected to database');

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS restaurant_service_db`);
    await connection.query(`USE restaurant_service_db`);

    // Ensure tables exist
    console.log('📋 Ensuring tables exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine_type VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        is_open BOOLEAN DEFAULT TRUE,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_name_address (name, address(100)),
        INDEX idx_cuisine_type (cuisine_type),
        INDEX idx_is_open (is_open)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        category VARCHAR(50) DEFAULT 'Makanan',
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        INDEX idx_restaurant_id (restaurant_id),
        INDEX idx_is_available (is_available),
        INDEX idx_category (category),
        UNIQUE KEY unique_restaurant_menu (restaurant_id, name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Clean existing data first
    console.log('🧹 Cleaning existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM menu_items');
    await connection.query('DELETE FROM restaurants');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert restaurants with dummy images
    console.log('📝 Inserting restaurants...');
    const restaurantImages = [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552569973-5d3b9a0e4b3c?w=800&h=600&fit=crop',
    ];

    const restaurants = [
      ['Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20', restaurantImages[0]],
      ['Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50', restaurantImages[1]],
      ['Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100', restaurantImages[2]],
      ['Restoran Padang Minang', 'Padang', 'Jl. Sudirman No. 45', restaurantImages[3]],
      ['Warung Tegal Sederhana', 'Jawa', 'Jl. Gatot Subroto No. 88', restaurantImages[4]],
    ];

    for (const [name, cuisine_type, address, image_url] of restaurants) {
      try {
        await connection.execute(
          'INSERT INTO restaurants (name, cuisine_type, address, is_open, image_url) VALUES (?, ?, ?, ?, ?)',
          [name, cuisine_type, address, true, image_url]
        );
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Restaurant "${name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Get restaurant IDs
    const [restaurantRows] = await connection.execute('SELECT id, name FROM restaurants ORDER BY id');
    const restaurantsData = restaurantRows as Array<{ id: number; name: string }>;
    console.log(`📋 Found ${restaurantsData.length} restaurants`);

    // Create mapping of restaurant names to IDs
    const restaurantMap = new Map<string, number>();
    restaurantsData.forEach(r => restaurantMap.set(r.name, r.id));

    // Menu item images
    const foodImages = [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=400&fit=crop',
    ];

    // Insert menu items
    console.log('📝 Inserting menu items...');
    const menuItems = [
      // Restaurant 1 - Sate Padang Asli
      ['Sate Padang Asli', 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental.', 25000, 50, 'Makanan', foodImages[0]],
      ['Sate Padang Asli', 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental.', 27000, 30, 'Makanan', foodImages[0]],
      ['Sate Padang Asli', 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, 'Makanan', foodImages[0]],
      ['Sate Padang Asli', 'Gulai Ikan', 'Gulai ikan dengan kuah santan yang gurih.', 28000, 35, 'Makanan', foodImages[0]],
      ['Sate Padang Asli', 'Es Teh Manis', 'Es teh manis segar.', 5000, 100, 'Minuman', foodImages[3]],
      ['Sate Padang Asli', 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, 'Minuman', foodImages[3]],
      // Restaurant 2 - Warung Nasi Sunda
      ['Warung Nasi Sunda', 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000, 60, 'Makanan', foodImages[1]],
      ['Warung Nasi Sunda', 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi.', 22000, 45, 'Makanan', foodImages[1]],
      ['Warung Nasi Sunda', 'Pepes Ikan', 'Pepes ikan dengan bumbu kemangi.', 25000, 40, 'Makanan', foodImages[1]],
      ['Warung Nasi Sunda', 'Kerupuk', 'Kerupuk renyah.', 3000, 200, 'Jajanan', foodImages[4]],
      ['Warung Nasi Sunda', 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, 'Minuman', foodImages[3]],
      ['Warung Nasi Sunda', 'Es Campur', 'Es campur dengan berbagai topping.', 8000, 80, 'Minuman', foodImages[3]],
      // Restaurant 3 - Bakso Malang Cak Kar
      ['Bakso Malang Cak Kar', 'Bakso Malang', 'Bakso urat dengan mie dan siomay.', 18000, 70, 'Makanan', foodImages[2]],
      ['Bakso Malang Cak Kar', 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis.', 20000, 50, 'Makanan', foodImages[2]],
      ['Bakso Malang Cak Kar', 'Mie Ayam', 'Mie ayam dengan topping lengkap.', 15000, 60, 'Makanan', foodImages[2]],
      ['Bakso Malang Cak Kar', 'Kerupuk Bakso', 'Kerupuk untuk bakso.', 2000, 150, 'Add On', foodImages[4]],
      ['Bakso Malang Cak Kar', 'Es Campur', 'Es campur dengan berbagai topping.', 8000, 80, 'Minuman', foodImages[3]],
      ['Bakso Malang Cak Kar', 'Es Teh Manis', 'Es teh manis segar.', 5000, 100, 'Minuman', foodImages[3]],
      // Restaurant 4 - Restoran Padang Minang
      ['Restoran Padang Minang', 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, 'Makanan', foodImages[0]],
      ['Restoran Padang Minang', 'Gulai Ayam', 'Gulai ayam dengan kuah santan yang gurih.', 25000, 45, 'Makanan', foodImages[0]],
      ['Restoran Padang Minang', 'Sate Padang', 'Sate daging sapi dengan kuah kuning kental.', 25000, 50, 'Makanan', foodImages[0]],
      ['Restoran Padang Minang', 'Es Teh Manis', 'Es teh manis segar.', 5000, 100, 'Minuman', foodImages[3]],
      // Restaurant 5 - Warung Tegal Sederhana
      ['Warung Tegal Sederhana', 'Nasi Rames', 'Nasi dengan lauk lengkap.', 15000, 80, 'Makanan', foodImages[1]],
      ['Warung Tegal Sederhana', 'Gudeg', 'Gudeg khas Yogyakarta.', 20000, 50, 'Makanan', foodImages[1]],
      ['Warung Tegal Sederhana', 'Pecel Lele', 'Pecel lele dengan sambal terasi.', 18000, 60, 'Makanan', foodImages[1]],
      ['Warung Tegal Sederhana', 'Kerupuk', 'Kerupuk renyah.', 3000, 200, 'Jajanan', foodImages[4]],
      ['Warung Tegal Sederhana', 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, 'Minuman', foodImages[3]],
    ];

    for (const item of menuItems) {
      const [restaurantName, name, description, price, stock, category, image_url] = item;
      const restaurantId = restaurantMap.get(restaurantName as string);
      if (!restaurantId) {
        console.error(`❌ Restaurant not found: ${restaurantName}`);
        continue;
      }
      try {
        await connection.execute(
          'INSERT IGNORE INTO menu_items (restaurant_id, name, description, price, stock, is_available, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [restaurantId, name, description, price, stock, true, category, image_url]
        );
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Menu item "${name}" already exists, skipping...`);
        } else {
          console.error(`❌ Error inserting menu item "${name}":`, error.message);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📊 Inserted ${restaurants.length} restaurants`);
    console.log(`📊 Inserted ${menuItems.length} menu items`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
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

