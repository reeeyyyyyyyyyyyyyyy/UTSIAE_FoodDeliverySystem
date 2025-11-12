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
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name_address (name, address(100)),
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

-- Insert sample data (clean duplicates first)
DELETE FROM restaurants WHERE id NOT IN (SELECT * FROM (SELECT MIN(id) FROM restaurants GROUP BY name, address) AS temp);
INSERT INTO restaurants (name, cuisine_type, address, is_open, image_url) VALUES
('Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20', TRUE, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'),
('Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50', TRUE, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
('Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100', TRUE, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample menu items (clean duplicates first)
DELETE FROM menu_items WHERE id NOT IN (SELECT * FROM (SELECT MIN(id) FROM menu_items GROUP BY restaurant_id, name) AS temp);
INSERT INTO menu_items (restaurant_id, name, description, price, stock, is_available, category, image_url) VALUES
(1, 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300'),
(1, 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental.', 27000, 30, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300'),
(1, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300'),
(1, 'Es Teh Manis', 'Es teh manis segar.', 5000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300'),
(2, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'),
(2, 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi.', 22000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'),
(2, 'Kerupuk', 'Kerupuk renyah.', 3000, 200, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300'),
(2, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300'),
(3, 'Bakso Malang', 'Bakso urat dengan mie dan siomay.', 18000, 70, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300'),
(3, 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis.', 20000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300'),
(3, 'Kerupuk Bakso', 'Kerupuk untuk bakso.', 2000, 150, TRUE, 'Add On', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300'),
(3, 'Es Campur', 'Es campur dengan berbagai topping.', 8000, 80, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300')
ON DUPLICATE KEY UPDATE name=name;

