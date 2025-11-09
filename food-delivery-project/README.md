# Food Delivery System - Microservices Architecture

Sistem Food Delivery berbasis microservices dengan 5 layanan yang berkomunikasi melalui API Gateway.

## Arsitektur Sistem

```
Frontend (React) 
    ↓
API Gateway (Port 3000)
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   User      │ Restaurant  │   Order     │  Payment    │   Driver    │
│  Service    │   Service   │   Service   │   Service   │   Service   │
│  (3001)     │   (3002)    │   (3003)    │   (3004)    │   (3005)    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
    ↓             ↓             ↓             ↓             ↓
  MySQL        MySQL         MySQL         MySQL         MySQL
(user_db)  (restaurant_db) (order_db)  (payment_db)  (driver_db)
```

## Teknologi Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: MySQL (5 database terpisah)
- **Documentation**: Swagger/OpenAPI
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Containerization**: Docker + Docker Compose

## Struktur Proyek

```
food-delivery-project/
├── 1-api-gateway/          # API Gateway dengan JWT Auth
├── 2-services/             # 5 Microservices
│   ├── 01-user-service/
│   ├── 02-restaurant-service/
│   ├── 03-order-service/
│   ├── 04-payment-service/
│   └── 05-driver-service/
├── 3-frontend/             # React Frontend
├── docker-compose.yml      # Docker Compose configuration
└── README.md
```

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- MySQL 8.0+
- npm atau yarn

## Setup & Running

### 1. Clone Repository

```bash
cd food-delivery-project
```

### 2. Setup Database

Buat 5 database MySQL:
- `user_service_db`
- `restaurant_service_db`
- `order_service_db`
- `payment_service_db`
- `driver_service_db`

Atau gunakan script SQL yang tersedia di setiap service untuk membuat tabel.

### 3. Environment Variables

Buat file `.env` di setiap service dan API Gateway. Lihat contoh di setiap direktori.

### 4. Run with Docker Compose

```bash
docker-compose up --build
```

Atau run services secara terpisah:

```bash
# Install dependencies untuk setiap service
cd 1-api-gateway && npm install
cd ../2-services/01-user-service && npm install
# ... dan seterusnya

# Run services
npm run dev  # di setiap service
```

## Services Endpoints

### API Gateway
- Base URL: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`
- Swagger Docs: `http://localhost:3000/api-docs`

### User Service
- Base URL: `http://localhost:3001`
- Swagger Docs: `http://localhost:3001/api-docs`

### Restaurant Service
- Base URL: `http://localhost:3002`
- Swagger Docs: `http://localhost:3002/api-docs`

### Order Service
- Base URL: `http://localhost:3003`
- Swagger Docs: `http://localhost:3003/api-docs`

### Payment Service
- Base URL: `http://localhost:3004`
- Swagger Docs: `http://localhost:3004/api-docs`

### Driver Service
- Base URL: `http://localhost:3005`
- Swagger Docs: `http://localhost:3005/api-docs`

### Frontend
- URL: `http://localhost:80`

## API Documentation

Setiap service memiliki dokumentasi Swagger yang dapat diakses melalui endpoint `/api-docs`.

Untuk dokumentasi lengkap API, lihat file `servicesSOA.md` di root project.

## Authentication

Sistem menggunakan JWT (JSON Web Token) untuk autentikasi.

1. Register user: `POST /api/users/auth/register`
2. Login: `POST /api/users/auth/login`
3. Gunakan token di header: `Authorization: Bearer <token>`

## Service Communication

Services berkomunikasi melalui HTTP API calls:

- Order Service memanggil User Service untuk validasi user
- Order Service memanggil Restaurant Service untuk validasi stok
- Order Service memanggil Payment Service untuk membuat invoice
- Payment Service memanggil Order Service via webhook setelah payment success

## Development

### Running Services Individually

```bash
# API Gateway
cd 1-api-gateway
npm install
npm run dev

# User Service
cd 2-services/01-user-service
npm install
npm run dev

# ... dan seterusnya
```

### Running Frontend

```bash
cd 3-frontend
npm install
npm run dev
```

## Testing

Gunakan Postman atau Swagger UI untuk testing API endpoints.

Collection Postman dapat di-export dari Swagger UI.

## Database Schemas

Setiap service memiliki database sendiri dengan schema yang dapat dilihat di:
- `2-services/{service-name}/src/database/schema.sql`

## Project Structure

```
food-delivery-project/
├── 1-api-gateway/          # API Gateway with JWT Auth
├── 2-services/             # 5 Microservices
│   ├── 01-user-service/
│   ├── 02-restaurant-service/
│   ├── 03-order-service/
│   ├── 04-payment-service/
│   └── 05-driver-service/
├── 3-frontend/             # React Frontend
├── docker-compose.yml      # Docker Compose configuration
├── SETUP.md                # Detailed setup guide
└── README.md               # This file
```

## Features

- ✅ JWT Authentication
- ✅ Service-to-Service Communication
- ✅ RESTful API with Swagger Documentation
- ✅ React Frontend with Tailwind CSS
- ✅ Framer Motion Animations
- ✅ Docker Support
- ✅ MySQL Database per Service
- ✅ API Gateway with Routing

## License

MIT

