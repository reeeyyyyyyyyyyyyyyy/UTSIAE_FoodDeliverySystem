# Setup Guide - Food Delivery System

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MySQL 8.0+ (if not using Docker)
- npm or yarn

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd food-delivery-project
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:80
   - API Gateway: http://localhost:3000
   - Swagger Docs:
     - User Service: http://localhost:3001/api-docs
     - Restaurant Service: http://localhost:3002/api-docs
     - Order Service: http://localhost:3003/api-docs
     - Payment Service: http://localhost:3004/api-docs
     - Driver Service: http://localhost:3005/api-docs

## Local Development Setup

### 1. Database Setup

Create 5 MySQL databases:
- `user_service_db`
- `restaurant_service_db`
- `order_service_db`
- `payment_service_db`
- `driver_service_db`

Or use the SQL scripts in each service's `src/database/init.sql` file.

### 2. Environment Variables

Create `.env` files in each service directory:

#### API Gateway (`1-api-gateway/.env`)
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

#### User Service (`2-services/01-user-service/.env`)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=user_service_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

#### Restaurant Service (`2-services/02-restaurant-service/.env`)
```env
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=restaurant_service_db
```

#### Order Service (`2-services/03-order-service/.env`)
```env
PORT=3003
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=order_service_db
USER_SERVICE_URL=http://localhost:3001
RESTAURANT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
DRIVER_SERVICE_URL=http://localhost:3005
```

#### Payment Service (`2-services/04-payment-service/.env`)
```env
PORT=3004
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payment_service_db
ORDER_SERVICE_URL=http://localhost:3003
```

#### Driver Service (`2-services/05-driver-service/.env`)
```env
PORT=3005
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=driver_service_db
ORDER_SERVICE_URL=http://localhost:3003
```

#### Frontend (`3-frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Install Dependencies

```bash
# Install dependencies for each service
cd 1-api-gateway && npm install
cd ../2-services/01-user-service && npm install
cd ../02-restaurant-service && npm install
cd ../03-order-service && npm install
cd ../04-payment-service && npm install
cd ../05-driver-service && npm install
cd ../../3-frontend && npm install
```

### 4. Build Services

```bash
# Build each service
cd 1-api-gateway && npm run build
cd ../2-services/01-user-service && npm run build
# ... and so on for each service
cd ../../3-frontend && npm run build
```

### 5. Run Services

Start each service in a separate terminal:

```bash
# Terminal 1: API Gateway
cd 1-api-gateway && npm run dev

# Terminal 2: User Service
cd 2-services/01-user-service && npm run dev

# Terminal 3: Restaurant Service
cd 2-services/02-restaurant-service && npm run dev

# Terminal 4: Order Service
cd 2-services/03-order-service && npm run dev

# Terminal 5: Payment Service
cd 2-services/04-payment-service && npm run dev

# Terminal 6: Driver Service
cd 2-services/05-driver-service && npm run dev

# Terminal 7: Frontend
cd 3-frontend && npm run dev
```

## Testing

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123!",
    "phone": "081234567890"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### 3. Get Restaurants

```bash
curl -X GET http://localhost:3000/api/restaurants
```

### 4. Create Order (with token)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurant_id": 1,
    "address_id": 1,
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 2
      }
    ]
  }'
```

## Troubleshooting

### Database Connection Issues

- Make sure MySQL is running
- Check database credentials in `.env` files
- Verify databases are created

### Service Communication Issues

- Check service URLs in `.env` files
- Verify all services are running
- Check network connectivity between services

### CORS Issues

- Make sure API Gateway has CORS enabled
- Check frontend API base URL

### JWT Token Issues

- Verify JWT_SECRET is the same across all services
- Check token expiration time
- Ensure token is being sent in Authorization header

## Production Deployment

1. Update environment variables for production
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up proper database backups
5. Configure monitoring and logging
6. Set up reverse proxy (nginx)
7. Use container orchestration (Kubernetes) for scaling

