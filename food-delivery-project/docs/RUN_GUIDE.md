# Panduan Menjalankan Proyek - Food Delivery System

## 📋 Daftar Isi
1. [Install TypeScript](#1-install-typescript)
2. [Menjalankan dengan Docker (Recommended)](#2-menjalankan-dengan-docker-recommended)
3. [Menjalankan Manual (Tanpa Docker)](#3-menjalankan-manual-tanpa-docker)

---

## 1. Install TypeScript

### Option A: Install Global (Recommended untuk development)
```bash
npm install -g typescript ts-node
```

### Option B: Install Local (Setiap project)
TypeScript akan terinstall otomatis ketika menjalankan `npm install` di setiap service (karena ada di `devDependencies`).

### Verifikasi Install
```bash
tsc --version
# Output: Version 5.3.3 (atau versi terbaru)
```

---

## 2. Menjalankan dengan Docker (Recommended)

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Langkah-langkah

#### Step 1: Pastikan Docker Running
```bash
# Check Docker status
docker --version
docker-compose --version

# Start Docker Desktop (jika belum running)
```

#### Step 2: Masuk ke Direktori Proyek
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project"
```

#### Step 3: Build dan Start Semua Services
```bash
# Build dan start semua services (termasuk database)
docker-compose up --build

# Atau run di background
docker-compose up -d --build
```

#### Step 4: Check Logs (Optional)
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f frontend
```

#### Step 5: Stop Services
```bash
# Stop semua services
docker-compose down

# Stop dan hapus volumes (database data)
docker-compose down -v
```

#### Step 6: Restart Services
```bash
# Restart semua services
docker-compose restart

# Restart specific service
docker-compose restart user-service
```

### Akses Aplikasi
- **Frontend**: http://localhost:80
- **API Gateway**: http://localhost:3000
- **Swagger Docs**:
  - User Service: http://localhost:3001/api-docs
  - Restaurant Service: http://localhost:3002/api-docs
  - Order Service: http://localhost:3003/api-docs
  - Payment Service: http://localhost:3004/api-docs
  - Driver Service: http://localhost:3005/api-docs

### Troubleshooting Docker

#### Port sudah digunakan
```bash
# Check port usage
lsof -i :3000
lsof -i :80

# Kill process menggunakan port
kill -9 <PID>
```

#### Database connection error
```bash
# Check database containers
docker-compose ps

# Check database logs
docker-compose logs mysql-user
docker-compose logs mysql-restaurant
```

#### Rebuild from scratch
```bash
# Stop dan hapus semua
docker-compose down -v

# Rebuild
docker-compose up --build
```

---

## 3. Menjalankan Manual (Tanpa Docker)

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (atau XAMPP/WAMP)
- 5 Database MySQL sudah dibuat

### Step 1: Setup Database

#### A. Buat 5 Database di MySQL
```sql
CREATE DATABASE user_service_db;
CREATE DATABASE restaurant_service_db;
CREATE DATABASE order_service_db;
CREATE DATABASE payment_service_db;
CREATE DATABASE driver_service_db;
```

#### B. Atau gunakan MySQL Command Line
```bash
mysql -u root -p

# Di dalam MySQL
CREATE DATABASE user_service_db;
CREATE DATABASE restaurant_service_db;
CREATE DATABASE order_service_db;
CREATE DATABASE payment_service_db;
CREATE DATABASE driver_service_db;
EXIT;
```

#### C. Import Schema (Optional - akan auto-create)
Schema akan dibuat otomatis saat service pertama kali run, atau bisa import manual dari file `src/database/init.sql` di setiap service.

### Step 2: Setup Environment Variables

Buat file `.env` di setiap service:

#### 1-api-gateway/.env
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
USER_SERVICE_URL=http://localhost:3001
RESTAURANT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
DRIVER_SERVICE_URL=http://localhost:3005
```

#### 2-services/01-user-service/.env
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=user_service_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

#### 2-services/02-restaurant-service/.env
```env
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_service_db
```

#### 2-services/03-order-service/.env
```env
PORT=3003
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=order_service_db
USER_SERVICE_URL=http://localhost:3001
RESTAURANT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
DRIVER_SERVICE_URL=http://localhost:3005
```

#### 2-services/04-payment-service/.env
```env
PORT=3004
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=payment_service_db
ORDER_SERVICE_URL=http://localhost:3003
```

#### 2-services/05-driver-service/.env
```env
PORT=3005
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=driver_service_db
ORDER_SERVICE_URL=http://localhost:3003
```

#### 3-frontend/.env
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Step 3: Install Dependencies

```bash
# Masuk ke direktori proyek
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project"

# Install API Gateway
cd 1-api-gateway
npm install
cd ..

# Install User Service
cd 2-services/01-user-service
npm install
cd ../..

# Install Restaurant Service
cd 2-services/02-restaurant-service
npm install
cd ../..

# Install Order Service
cd 2-services/03-order-service
npm install
cd ../..

# Install Payment Service
cd 2-services/04-payment-service
npm install
cd ../..

# Install Driver Service
cd 2-services/05-driver-service
npm install
cd ../..

# Install Frontend
cd 3-frontend
npm install
cd ..
```

### Step 4: Build Services (Optional - untuk production)

```bash
# Build API Gateway
cd 1-api-gateway
npm run build
cd ..

# Build semua services (sama seperti di atas)
# Atau langsung run dengan dev mode (tidak perlu build)
```

### Step 5: Run Services

Buka **7 terminal berbeda** (atau gunakan terminal multiplexer seperti `tmux`):

#### Terminal 1: API Gateway
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/1-api-gateway"
npm run dev
```

#### Terminal 2: User Service
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/2-services/01-user-service"
npm run dev
```

#### Terminal 3: Restaurant Service
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/2-services/02-restaurant-service"
npm run dev
```

#### Terminal 4: Order Service
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/2-services/03-order-service"
npm run dev
```

#### Terminal 5: Payment Service
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/2-services/04-payment-service"
npm run dev
```

#### Terminal 6: Driver Service
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/2-services/05-driver-service"
npm run dev
```

#### Terminal 7: Frontend
```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project/3-frontend"
npm run dev
```

### Step 6: Akses Aplikasi

- **Frontend**: http://localhost:5173 (Vite dev server)
- **API Gateway**: http://localhost:3000
- **Swagger Docs**: http://localhost:3001/api-docs (dan service lainnya)

### Troubleshooting Manual Setup

#### Port already in use
```bash
# Kill process di port tertentu
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
# ... dan seterusnya
```

#### Database connection error
- Pastikan MySQL running
- Check credentials di `.env`
- Pastikan database sudah dibuat
- Check MySQL user permissions

#### Module not found
```bash
# Install ulang dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript errors
```bash
# Rebuild TypeScript
npm run build

# Check TypeScript version
tsc --version
```

---

## 🚀 Quick Start Scripts

### Script untuk Run Semua Services (Mac/Linux)

Buat file `start-all.sh`:

```bash
#!/bin/bash

# Start all services in background
cd 1-api-gateway && npm run dev &
cd ../2-services/01-user-service && npm run dev &
cd ../02-restaurant-service && npm run dev &
cd ../03-order-service && npm run dev &
cd ../04-payment-service && npm run dev &
cd ../05-driver-service && npm run dev &
cd ../../3-frontend && npm run dev &

echo "All services started!"
echo "Press Ctrl+C to stop all services"
wait
```

### Script untuk Stop Semua Services

Buat file `stop-all.sh`:

```bash
#!/bin/bash

# Kill all Node processes
pkill -f "node.*dev"
pkill -f "ts-node-dev"

echo "All services stopped!"
```

---

## 📝 Checklist

### Untuk Docker:
- [ ] Docker Desktop installed dan running
- [ ] Masuk ke direktori proyek
- [ ] Run `docker-compose up --build`
- [ ] Tunggu semua services running
- [ ] Akses http://localhost:80

### Untuk Manual:
- [ ] Node.js 18+ installed
- [ ] MySQL installed dan running
- [ ] 5 database dibuat
- [ ] File `.env` dibuat di setiap service
- [ ] Dependencies installed (`npm install`)
- [ ] Semua services running di terminal berbeda
- [ ] Akses http://localhost:5173 (frontend)

---

## 💡 Tips

1. **Gunakan Docker** untuk development yang lebih mudah
2. **Gunakan Manual** jika ingin lebih kontrol atau debug lebih detail
3. **Check logs** jika ada error
4. **Pastikan port tidak conflict** dengan aplikasi lain
5. **Gunakan `.env` file** untuk konfigurasi (jangan commit ke git)

---

## 🆘 Need Help?

Jika ada masalah:
1. Check logs di terminal
2. Check database connection
3. Check port availability
4. Check environment variables
5. Lihat dokumentasi di `SETUP.md` dan `API_TESTING.md`

