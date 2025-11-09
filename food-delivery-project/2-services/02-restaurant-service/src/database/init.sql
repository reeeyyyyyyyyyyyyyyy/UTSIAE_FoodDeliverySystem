-- Restaurant Service Database Schema
-- Database: restaurant_service_db

CREATE DATABASE IF NOT EXISTS restaurant_service_db;
USE restaurant_service_db;

-- Restaurants table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu items table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO restaurants (name, cuisine_type, address, is_open) VALUES
('Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20', TRUE),
('Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50', TRUE),
('Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price, stock, is_available) VALUES
(1, 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental.', 25000, 50, TRUE),
(1, 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental.', 27000, 30, TRUE),
(1, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, TRUE),
(2, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000, 60, TRUE),
(2, 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi.', 22000, 45, TRUE),
(3, 'Bakso Malang', 'Bakso urat dengan mie dan siomay.', 18000, 70, TRUE),
(3, 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis.', 20000, 50, TRUE)
ON DUPLICATE KEY UPDATE name=name;

