import pool from './connection';

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Driver Service Database...');

    // Create drivers table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        vehicle VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'OFFLINE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create delivery tasks table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS delivery_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        driver_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'ASSIGNED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_driver_id (driver_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check if drivers already exist
    const [existingDrivers] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
    const count = (existingDrivers as any[])[0].count;

    if (count === 0) {
      // Insert dummy drivers
      await pool.execute(`
        INSERT INTO drivers (name, phone, vehicle, status) VALUES
        ('Agus', '08987654321', 'B 1234 XYZ', 'AVAILABLE'),
        ('Budi', '08987654322', 'B 5678 ABC', 'AVAILABLE'),
        ('Cici', '08987654323', 'B 9012 DEF', 'OFFLINE'),
        ('Dedi', '08987654324', 'B 3456 GHI', 'AVAILABLE'),
        ('Eko', '08987654325', 'B 7890 JKL', 'AVAILABLE')
      `);
      
      console.log('✅ Dummy drivers inserted');
    } else {
      console.log('⚠️  Drivers already exist, skipping insert');
    }

    console.log('✅ Driver Service Database initialized successfully!');
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

