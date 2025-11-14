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
DELETE FROM menu_items;
DELETE FROM restaurants;

-- Insert restaurants with images
INSERT INTO restaurants (name, cuisine_type, address, is_open, image_url) VALUES
('Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20, Bandung', TRUE, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'),
('Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50, Bandung', TRUE, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
('Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100, Bandung', TRUE, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'),
('Nasi Goreng Kambing Kebon Sirih', 'Jawa', 'Jl. Kebon Sirih No. 15, Jakarta', TRUE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'),
('Gudeg Jogja Bu Tjitro', 'Jawa', 'Jl. Malioboro No. 25, Yogyakarta', TRUE, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop'),
('Rawon Setan Surabaya', 'Jawa', 'Jl. Embong Malang No. 30, Surabaya', TRUE, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop'),
('Pempek Palembang Asli', 'Sumatera', 'Jl. Sudirman No. 45, Palembang', TRUE, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop'),
('Soto Betawi Haji Husein', 'Betawi', 'Jl. Fatmawati No. 60, Jakarta', TRUE, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'),
('Gado-Gado Boplo', 'Betawi', 'Jl. Thamrin No. 70, Jakarta', TRUE, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'),
('Ayam Betutu Khas Bali', 'Bali', 'Jl. Raya Ubud No. 80, Bali', TRUE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'),
('Coto Makassar Daeng Tata', 'Sulawesi', 'Jl. Ahmad Yani No. 90, Makassar', TRUE, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'),
('Sop Konro Karebosi', 'Sulawesi', 'Jl. Karebosi No. 100, Makassar', TRUE, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'),
('Pepes Ikan Mas Sunda', 'Sunda', 'Jl. Padjadjaran No. 110, Bandung', TRUE, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop'),
('Sate Kambing Madura', 'Madura', 'Jl. Diponegoro No. 120, Surabaya', TRUE, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'),
('Nasi Padang Sederhana', 'Padang', 'Jl. Gatot Subroto No. 130, Jakarta', TRUE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop')
ON DUPLICATE KEY UPDATE name=name;

-- Insert menu items with images
INSERT INTO menu_items (restaurant_id, name, description, price, stock, is_available, category, image_url) VALUES
-- Sate Padang Asli (1)
(1, 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental khas Padang.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(1, 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental yang gurih.', 27000, 30, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(1, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya dan empuk.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(1, 'Gulai Ikan', 'Gulai ikan dengan kuah kuning yang segar dan pedas.', 28000, 35, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(1, 'Es Teh Manis', 'Es teh manis segar khas Padang.', 5000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),
(1, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Warung Nasi Sunda (2)
(2, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda yang lengkap.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(2, 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi yang pedas.', 22000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(2, 'Pepes Ikan', 'Pepes ikan mas dengan bumbu kemangi yang harum.', 25000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(2, 'Tumis Kangkung', 'Tumis kangkung dengan terasi yang gurih.', 12000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(2, 'Kerupuk', 'Kerupuk renyah sebagai pelengkap.', 3000, 200, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(2, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Bakso Malang Cak Kar (3)
(3, 'Bakso Malang', 'Bakso urat dengan mie dan siomay yang lengkap.', 18000, 70, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(3, 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis yang nikmat.', 20000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(3, 'Bakso Urat', 'Bakso urat dengan kuah kaldu yang gurih.', 22000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(3, 'Mie Ayam', 'Mie ayam dengan topping lengkap dan kuah kaldu.', 15000, 80, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(3, 'Kerupuk Bakso', 'Kerupuk untuk bakso.', 2000, 150, TRUE, 'Add On', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(3, 'Es Campur', 'Es campur dengan berbagai topping yang segar.', 8000, 80, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Nasi Goreng Kambing Kebon Sirih (4)
(4, 'Nasi Goreng Kambing', 'Nasi goreng kambing dengan bumbu rempah yang khas.', 30000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(4, 'Nasi Goreng Seafood', 'Nasi goreng dengan seafood yang lengkap.', 28000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(4, 'Nasi Goreng Spesial', 'Nasi goreng spesial dengan telur dan ayam.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(4, 'Kerupuk Udang', 'Kerupuk udang renyah.', 5000, 100, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(4, 'Es Teh Tawar', 'Es teh tawar segar.', 4000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Gudeg Jogja Bu Tjitro (5)
(5, 'Gudeg Komplit', 'Gudeg dengan nasi, ayam, telur, dan sambal krecek.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(5, 'Gudeg Kering', 'Gudeg kering dengan bumbu yang meresap.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(5, 'Sambal Krecek', 'Sambal krecek pedas khas Jogja.', 8000, 80, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(5, 'Es Jeruk Nipis', 'Es jeruk nipis segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Rawon Setan Surabaya (6)
(6, 'Rawon Setan', 'Rawon daging sapi dengan kuah hitam khas Surabaya.', 28000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop'),
(6, 'Rawon Komplit', 'Rawon dengan telur asin dan kerupuk udang.', 32000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop'),
(6, 'Kerupuk Udang', 'Kerupuk udang renyah.', 5000, 100, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(6, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Pempek Palembang Asli (7)
(7, 'Pempek Kapal Selam', 'Pempek dengan telur di dalamnya.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop'),
(7, 'Pempek Lenjer', 'Pempek lenjer dengan kuah cuko yang asam manis.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop'),
(7, 'Pempek Adaan', 'Pempek adaan bulat dengan kuah cuko.', 18000, 70, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop'),
(7, 'Tekwan', 'Tekwan dengan kuah kaldu udang yang gurih.', 22000, 55, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop'),
(7, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Soto Betawi Haji Husein (8)
(8, 'Soto Betawi', 'Soto Betawi dengan daging sapi dan kuah santan yang gurih.', 30000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(8, 'Soto Betawi Komplit', 'Soto Betawi dengan jeroan dan daging sapi.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(8, 'Kerupuk', 'Kerupuk renyah.', 3000, 100, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(8, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Gado-Gado Boplo (9)
(9, 'Gado-Gado', 'Gado-gado dengan bumbu kacang yang khas.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(9, 'Ketoprak', 'Ketoprak dengan tahu, lontong, dan bumbu kacang.', 18000, 70, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(9, 'Lontong Sayur', 'Lontong sayur dengan kuah santan yang gurih.', 15000, 80, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(9, 'Kerupuk', 'Kerupuk renyah.', 3000, 100, TRUE, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop'),
(9, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Ayam Betutu Khas Bali (10)
(10, 'Ayam Betutu', 'Ayam betutu dengan bumbu rempah khas Bali yang kaya.', 40000, 35, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(10, 'Bebek Betutu', 'Bebek betutu dengan bumbu rempah yang meresap.', 45000, 30, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(10, 'Lawar', 'Lawar khas Bali dengan bumbu yang segar.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(10, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Coto Makassar Daeng Tata (11)
(11, 'Coto Makassar', 'Coto Makassar dengan daging sapi dan jeroan.', 30000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(11, 'Coto Komplit', 'Coto Makassar komplit dengan semua isian.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(11, 'Burasa', 'Burasa khas Makassar sebagai pelengkap.', 8000, 80, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(11, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Sop Konro Karebosi (12)
(12, 'Sop Konro', 'Sop konro dengan iga sapi yang empuk.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(12, 'Sop Konro Komplit', 'Sop konro komplit dengan semua isian.', 40000, 35, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop'),
(12, 'Burasa', 'Burasa khas Makassar.', 8000, 80, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(12, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Pepes Ikan Mas Sunda (13)
(13, 'Pepes Ikan Mas', 'Pepes ikan mas dengan bumbu kemangi yang harum.', 28000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(13, 'Pepes Ayam', 'Pepes ayam dengan bumbu rempah yang khas.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(13, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000, 60, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'),
(13, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Sate Kambing Madura (14)
(14, 'Sate Kambing', 'Sate kambing dengan bumbu kacang yang khas.', 30000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(14, 'Sate Kambing Muda', 'Sate kambing muda yang empuk dan gurih.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(14, 'Gule Kambing', 'Gule kambing dengan kuah santan yang gurih.', 32000, 42, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(14, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),

-- Nasi Padang Sederhana (15)
(15, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000, 40, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'),
(15, 'Gulai Ayam', 'Gulai ayam dengan kuah kuning yang gurih.', 25000, 50, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(15, 'Ayam Pop', 'Ayam pop dengan sambal hijau yang pedas.', 22000, 55, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop'),
(15, 'Gulai Ikan', 'Gulai ikan dengan kuah kuning yang segar.', 28000, 45, TRUE, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop'),
(15, 'Es Teh Manis', 'Es teh manis segar.', 5000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop'),
(15, 'Es Jeruk', 'Es jeruk peras segar.', 6000, 100, TRUE, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop')
ON DUPLICATE KEY UPDATE name=name;
