import pool from './connection';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing User Service Database...');

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create addresses table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        label VARCHAR(100) NOT NULL,
        full_address TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check if users already exist
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const count = (existingUsers as any[])[0].count;

    if (count === 0) {
      // Insert dummy users (password: Password123!)
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      await pool.execute(`
        INSERT INTO users (name, email, password, phone, role) VALUES
        ('Admin User', 'admin@example.com', ?, '081234567890', 'admin'),
        ('Budi Santoso', 'budi@example.com', ?, '081234567891', 'user'),
        ('Siti Nurhaliza', 'siti@example.com', ?, '081234567892', 'user')
      `, [hashedPassword, hashedPassword, hashedPassword]);
      
      console.log('✅ Dummy users inserted');
    } else {
      console.log('⚠️  Users already exist, skipping insert');
    }

    // Check if addresses already exist
    const [existingAddresses] = await pool.execute('SELECT COUNT(*) as count FROM addresses');
    const addrCount = (existingAddresses as any[])[0].count;

    if (addrCount === 0) {
      // Insert dummy addresses
      await pool.execute(`
        INSERT INTO addresses (user_id, label, full_address, is_default) VALUES
        (1, 'Rumah', 'Jl. Telekomunikasi No. 1, Bandung', TRUE),
        (1, 'Kantor', 'Jl. Gegerkalong Hilir No. 47, Bandung', FALSE),
        (2, 'Rumah', 'Jl. Dago No. 100, Bandung', TRUE),
        (3, 'Rumah', 'Jl. Setiabudi No. 50, Bandung', TRUE)
      `);
      
      console.log('✅ Dummy addresses inserted');
    } else {
      console.log('⚠️  Addresses already exist, skipping insert');
    }

    console.log('✅ User Service Database initialized successfully!');
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

