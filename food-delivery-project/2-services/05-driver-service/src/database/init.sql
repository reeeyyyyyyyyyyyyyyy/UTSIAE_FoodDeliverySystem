-- Driver Service Database Schema
-- Database: driver_service_db

CREATE DATABASE IF NOT EXISTS driver_service_db;
USE driver_service_db;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
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

-- Driver salaries table
CREATE TABLE IF NOT EXISTS driver_salaries (
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
    INDEX idx_month_year (month, year),
    UNIQUE KEY unique_driver_month_year (driver_id, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Driver data is inserted via migrate.ts script
-- The migrate.ts script follows SOA principle by:
-- 1. Querying user_service_db to get ALL users with role='driver'
-- 2. Inserting drivers with correct user_id that matches user_service_db
-- This ensures proper communication between Driver Service and User Service
-- Run: npm run migrate to populate driver data

