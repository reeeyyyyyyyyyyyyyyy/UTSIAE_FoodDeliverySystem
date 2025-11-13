-- User Service Database Schema
-- Database: user_service_db

CREATE DATABASE IF NOT EXISTS user_service_db;
USE user_service_db;

-- Users table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addresses table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
-- Password: Password123! (hashed with bcrypt)
-- To generate new hash, run: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Password123!', 10).then(hash => console.log(hash));"
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin User', 'admin@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567890', 'admin'),
('Driver One', 'driver1@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567891', 'driver'),
('Driver Two', 'driver2@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567892', 'driver'),
('Customer One', 'customer1@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567893', 'customer'),
('Customer Two', 'customer2@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567894', 'customer'),
('Customer Three', 'customer3@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567895', 'customer')
ON DUPLICATE KEY UPDATE email=email;

