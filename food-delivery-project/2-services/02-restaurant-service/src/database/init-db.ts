import pool from './connection';

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Restaurant Service Database...');

    // Create restaurants table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine_type VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        is_open BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cuisine_type (cuisine_type),
        INDEX idx_is_open (is_open)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create menu items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        INDEX idx_restaurant_id (restaurant_id),
        INDEX idx_is_available (is_available)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check if restaurants already exist
    const [existingRestaurants] = await pool.execute('SELECT COUNT(*) as count FROM restaurants');
    const count = (existingRestaurants as any[])[0].count;

    if (count === 0) {
      // Insert dummy restaurants
      await pool.execute(`
        INSERT INTO restaurants (name, cuisine_type, address, is_open) VALUES
        ('Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20', TRUE),
        ('Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50', TRUE),
        ('Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100', TRUE),
        ('Pizza Hut', 'Western', 'Jl. Riau No. 25', TRUE),
        ('KFC', 'Fast Food', 'Jl. Asia Afrika No. 150', TRUE)
      `);
      
      console.log('✅ Dummy restaurants inserted');
    } else {
      console.log('⚠️  Restaurants already exist, skipping insert');
    }

    // Check if menu items already exist
    const [existingMenuItems] = await pool.execute('SELECT COUNT(*) as count FROM menu_items');
    const menuCount = (existingMenuItems as any[])[0].count;

    if (menuCount === 0) {
      // Insert dummy menu items
      await pool.execute(`
        INSERT INTO menu_items (restaurant_id, name, description, price, stock, is_available) VALUES
        (1, 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental.', 25000, 50, TRUE),
        (1, 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental.', 27000, 30, TRUE),
        (1, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, TRUE),
        (2, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000, 60, TRUE),
        (2, 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi.', 22000, 45, TRUE),
        (2, 'Pepes Ikan', 'Pepes ikan mas dengan bumbu kuning.', 28000, 35, TRUE),
        (3, 'Bakso Malang', 'Bakso urat dengan mie dan siomay.', 18000, 70, TRUE),
        (3, 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis.', 20000, 50, TRUE),
        (3, 'Mie Ayam', 'Mie ayam dengan topping lengkap.', 15000, 80, TRUE),
        (4, 'Pizza Margherita', 'Pizza dengan tomat, mozzarella, dan basil.', 65000, 25, TRUE),
        (4, 'Pizza Pepperoni', 'Pizza dengan pepperoni dan keju mozzarella.', 75000, 30, TRUE),
        (5, 'Fried Chicken (2 pcs)', 'Ayam goreng krispi 2 potong.', 25000, 100, TRUE),
        (5, 'Burger', 'Burger dengan daging sapi dan sayuran.', 30000, 60, TRUE)
      `);
      
      console.log('✅ Dummy menu items inserted');
    } else {
      console.log('⚠️  Menu items already exist, skipping insert');
    }

    console.log('✅ Restaurant Service Database initialized successfully!');
  } catch (error: any) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;

