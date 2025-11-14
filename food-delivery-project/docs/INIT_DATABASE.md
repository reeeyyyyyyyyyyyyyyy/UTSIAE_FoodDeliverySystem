# Database Initialization Guide

## Auto-Initialization

Database akan **otomatis di-initialize** ketika service pertama kali start. Ini termasuk:
- ✅ Create tables
- ✅ Insert dummy data (users, restaurants, menu items, drivers)

## Manual Initialization

Jika ingin initialize manual, jalankan:

### User Service
```bash
cd 2-services/01-user-service
npx ts-node src/database/init-db.ts
```

### Restaurant Service
```bash
cd 2-services/02-restaurant-service
npx ts-node src/database/init-db.ts
```

### Order Service
```bash
cd 2-services/03-order-service
npx ts-node src/database/init-db.ts
```

### Payment Service
```bash
cd 2-services/04-payment-service
npx ts-node src/database/init-db.ts
```

### Driver Service
```bash
cd 2-services/05-driver-service
npx ts-node src/database/init-db.ts
```

## Dummy Data

### Users (Password: `Password123!`)
- Admin: `admin@example.com` / `Password123!`
- User 1: `budi@example.com` / `Password123!`
- User 2: `siti@example.com` / `Password123!`

### Restaurants
- Sate Padang Asli (Padang)
- Warung Nasi Sunda (Sunda)
- Bakso Malang Cak Kar (Jawa)
- Pizza Hut (Western)
- KFC (Fast Food)

### Menu Items
Setiap restaurant sudah punya menu items dengan stock.

### Drivers
- Agus (AVAILABLE)
- Budi (AVAILABLE)
- Cici (OFFLINE)
- Dedi (AVAILABLE)
- Eko (AVAILABLE)

## Reset Database

Untuk reset database:

```sql
-- User Service
DROP DATABASE IF EXISTS user_service_db;
CREATE DATABASE user_service_db;

-- Restaurant Service
DROP DATABASE IF EXISTS restaurant_service_db;
CREATE DATABASE restaurant_service_db;

-- Order Service
DROP DATABASE IF EXISTS order_service_db;
CREATE DATABASE order_service_db;

-- Payment Service
DROP DATABASE IF EXISTS payment_service_db;
CREATE DATABASE payment_service_db;

-- Driver Service
DROP DATABASE IF EXISTS driver_service_db;
CREATE DATABASE driver_service_db;
```

Kemudian restart services, database akan auto-initialize.

