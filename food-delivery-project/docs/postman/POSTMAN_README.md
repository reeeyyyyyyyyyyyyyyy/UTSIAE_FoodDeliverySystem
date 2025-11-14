# Postman Collection - Food Delivery System

## 📋 Deskripsi

Postman Collection untuk **Food Delivery System** dengan 5 Services sesuai requirement UTS IAE/EAI:
- User Service
- Restaurant Service
- Order Service
- Payment Service
- Driver Service

## 📁 File yang Tersedia

1. **postman-collection.json** - Collection utama dengan semua endpoint
2. **postman-environment.json** - Environment variables untuk development

## 🚀 Cara Import ke Postman

### Langkah 1: Import Collection
1. Buka Postman Desktop atau Web
2. Klik **Import** (tombol di pojok kiri atas)
3. Pilih file **postman-collection.json**
4. Klik **Import**

### Langkah 2: Import Environment
1. Klik **Import** lagi
2. Pilih file **postman-environment.json**
3. Klik **Import**

### Langkah 3: Select Environment
1. Di dropdown environment (pojok kanan atas), pilih **"Food Delivery System - Development"**

## 🔐 Authentication

Collection menggunakan **JWT Bearer Token** untuk authentication.

### Cara Mendapatkan Token:
1. Jalankan request **"2. User Service > Auth > Login"**
2. Token akan otomatis tersimpan di environment variable `auth_token`
3. Semua request yang memerlukan auth akan menggunakan token ini

### Manual Token Setup:
Jika ingin set token manual:
1. Klik environment **"Food Delivery System - Development"**
2. Edit variable `auth_token`
3. Paste token JWT Anda

## 📚 Struktur Collection

### 1. API Gateway
- **Health Check** - GET `/health`
- **Root** - GET `/`

### 2. User Service

#### Auth (Public)
- **Register** - POST `/api/users/auth/register`
  - Body: `{ name, email, password, phone, role }`
  - Auto-save token setelah register
  
- **Login** - POST `/api/users/auth/login`
  - Body: `{ email, password }`
  - Auto-save token dan user info setelah login

#### Profile (Protected)
- **Get Profile** - GET `/api/users/profile`
  - Requires: JWT Token

#### Addresses (Protected)
- **Get Addresses** - GET `/api/users/addresses`
- **Create Address** - POST `/api/users/addresses`
  - Body: `{ label, full_address, is_default }`
- **Update Address** - PUT `/api/users/addresses/:id`
  - Body: `{ label, full_address, is_default }`
- **Delete Address** - DELETE `/api/users/addresses/:id`

#### Admin (Protected - Admin Only)
- **Get All Users** - GET `/api/users/admin/all`

### 3. Restaurant Service

#### Public (No Auth)
- **Get All Restaurants** - GET `/api/restaurants`
  - Query: `?cuisine_type=Padang` (optional)
- **Get Restaurant Menu** - GET `/api/restaurants/:id/menu`

#### Admin - Restaurants (Protected - Admin Only)
- **Create Restaurant** - POST `/api/restaurants`
  - Form-data: `name, cuisine_type, address, is_open, image`
- **Update Restaurant** - PUT `/api/restaurants/:id`
  - Form-data: `name, cuisine_type, address, image`
- **Delete Restaurant** - DELETE `/api/restaurants/:id`

#### Admin - Menu Items (Protected - Admin Only)
- **Create Menu Item** - POST `/api/restaurants/:id/menu`
  - Form-data: `name, description, price, stock, category, image`
- **Update Menu Item** - PUT `/api/restaurants/menu-items/:id`
  - Form-data: `name, description, price, stock, category, image`
- **Delete Menu Item** - DELETE `/api/restaurants/menu-items/:id`
- **Update Stock** - PUT `/api/restaurants/menu-items/:id/stock`
  - Body: `{ stock: 100 }`
- **Update Availability** - PUT `/api/restaurants/menu-items/:id/availability`
  - Toggle availability

### 4. Order Service

#### Customer (Protected)
- **Create Order** - POST `/api/orders`
  - Body: `{ restaurant_id, address_id, items: [{ menu_item_id, quantity }] }`
- **Get My Orders** - GET `/api/orders`
- **Get Order By ID** - GET `/api/orders/:id`

#### Driver (Protected - Driver Only)
- **Get Available Orders** - GET `/api/orders/available`
- **Get My Orders (Driver)** - GET `/api/orders/driver/my-orders`
- **Accept Order** - POST `/api/orders/:id/accept`
- **Complete Order** - POST `/api/orders/:id/complete`

#### Admin (Protected - Admin Only)
- **Get All Orders** - GET `/api/orders/admin/all`
- **Get Dashboard Stats** - GET `/api/orders/admin/dashboard/stats`
- **Get Sales Statistics** - GET `/api/orders/admin/sales/statistics`
- **Get Restaurant Sales** - GET `/api/orders/admin/sales/restaurants`

### 5. Payment Service

#### Customer (Protected)
- **Simulate Payment** - POST `/api/payments/simulate`
  - Body: `{ order_id, payment_id, payment_method }`

### 6. Driver Service

#### Driver Profile (Protected - Driver Only)
- **Get Profile** - GET `/api/drivers/profile`
- **Update Profile** - PUT `/api/drivers/profile`
  - Body: `{ license_number, vehicle_type, vehicle_number }`

#### Admin (Protected - Admin Only)
- **Get All Drivers** - GET `/api/drivers/admin/all`
- **Get Driver Salaries** - GET `/api/drivers/admin/salaries`
- **Create Salary** - POST `/api/drivers/admin/salaries`
  - Body: `{ driver_id, amount, period }`
- **Update Salary Status** - PUT `/api/drivers/admin/salaries/:id/status`
  - Body: `{ status: "PAID" }`
- **Mark Earnings as Paid** - POST `/api/drivers/admin/salaries/mark-as-paid/:driverId`

## 🔧 Environment Variables

Collection menggunakan environment variables berikut:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API Gateway base URL |
| `auth_token` | (empty) | JWT token (auto-filled setelah login) |
| `user_id` | (empty) | User ID (auto-filled setelah login) |
| `user_role` | (empty) | User role (auto-filled setelah login) |
| `user_service_url` | `http://localhost:3001` | User Service URL |
| `restaurant_service_url` | `http://localhost:3002` | Restaurant Service URL |
| `order_service_url` | `http://localhost:3003` | Order Service URL |
| `payment_service_url` | `http://localhost:3004` | Payment Service URL |
| `driver_service_url` | `http://localhost:3005` | Driver Service URL |

## 📝 Contoh Request Flow

### Flow 1: Customer Order Flow
1. **Login** → `POST /api/users/auth/login`
2. **Get Restaurants** → `GET /api/restaurants`
3. **Get Restaurant Menu** → `GET /api/restaurants/:id/menu`
4. **Create Order** → `POST /api/orders`
5. **Simulate Payment** → `POST /api/payments/simulate`
6. **Get My Orders** → `GET /api/orders`

### Flow 2: Driver Flow
1. **Login (as driver)** → `POST /api/users/auth/login`
2. **Get Available Orders** → `GET /api/orders/available`
3. **Accept Order** → `POST /api/orders/:id/accept`
4. **Complete Order** → `POST /api/orders/:id/complete`
5. **Get My Orders** → `GET /api/orders/driver/my-orders`

### Flow 3: Admin Flow
1. **Login (as admin)** → `POST /api/users/auth/login`
2. **Get All Orders** → `GET /api/orders/admin/all`
3. **Get Dashboard Stats** → `GET /api/orders/admin/dashboard/stats`
4. **Get All Drivers** → `GET /api/drivers/admin/all`
5. **Get All Users** → `GET /api/users/admin/all`

## ⚠️ Catatan Penting

1. **Authentication**: Sebagian besar endpoint memerlukan JWT token. Pastikan sudah login terlebih dahulu.

2. **Role-based Access**: 
   - Customer endpoints: role `customer`
   - Driver endpoints: role `driver`
   - Admin endpoints: role `admin`

3. **Base URL**: Default adalah `http://localhost:3000` (API Gateway). Pastikan semua services berjalan.

4. **Auto Token**: Token akan otomatis tersimpan setelah login/register melalui test script.

5. **Path Variables**: Beberapa request menggunakan path variables (e.g., `:id`). Edit di tab Params atau langsung di URL.

## 🧪 Testing

Collection sudah include test scripts untuk:
- Auto-save token setelah login/register
- Auto-save user info setelah login

Untuk menambahkan test assertions, edit di tab **Tests** pada setiap request.

## 📖 Dokumentasi Lengkap

Untuk dokumentasi lengkap setiap service, akses Swagger UI:
- User Service: `http://localhost:3001/api-docs`
- Restaurant Service: `http://localhost:3002/api-docs`
- Order Service: `http://localhost:3003/api-docs`
- Payment Service: `http://localhost:3004/api-docs`
- Driver Service: `http://localhost:3005/api-docs`

## 🐛 Troubleshooting

### Token tidak tersimpan
- Pastikan environment sudah di-select
- Check test script di request Login/Register
- Manual set token di environment variables

### 401 Unauthorized
- Pastikan sudah login dan token valid
- Check token di environment variable `auth_token`
- Token mungkin expired, login ulang

### 403 Forbidden
- Check user role sesuai dengan endpoint
- Admin endpoints memerlukan role `admin`
- Driver endpoints memerlukan role `driver`

### 404 Not Found
- Pastikan semua services berjalan
- Check base_url di environment
- Pastikan endpoint path benar

## 📞 Support

Jika ada masalah:
1. Check semua services berjalan
2. Check environment variables
3. Check Swagger documentation
4. Check console logs di setiap service

---

**Dibuat untuk UTS IAE/EAI - Food Delivery System**

