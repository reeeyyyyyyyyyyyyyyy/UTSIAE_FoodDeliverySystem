import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'user_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database on connection
let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;
  
  try {
    const initDb = await import('./init-db');
    await initDb.default();
    isInitialized = true;
  } catch (error: any) {
    // Ignore errors if tables already exist
    if (!error.message?.includes('already exists')) {
      console.error('⚠️  Database initialization error:', error.message);
    }
  }
}

// Test connection and initialize database
pool
  .getConnection()
  .then(async (connection) => {
    console.log('✅ Connected to MySQL database');
    connection.release();
    
    // Initialize database (create tables and insert dummy data)
    await initializeDatabase();
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
  });

export default pool;

