# API Testing Guide

## Base URL

- API Gateway: `http://localhost:3000/api`
- Direct Service URLs (for testing):
  - User Service: `http://localhost:3001`
  - Restaurant Service: `http://localhost:3002`
  - Order Service: `http://localhost:3003`
  - Payment Service: `http://localhost:3004`
  - Driver Service: `http://localhost:3005`

## Authentication

Most endpoints require JWT token. Get token by logging in first.

## Test Flow

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "Password123!",
    "phone": "081234567890"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budi@example.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Save the token for subsequent requests.

### 3. Get User Profile

```bash
curl -X GET http://localhost:3000/api/users/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Add Address

```bash
curl -X POST http://localhost:3000/api/users/addresses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Rumah",
    "full_address": "Jl. Telekomunikasi No. 1, Bandung",
    "is_default": true
  }'
```

### 5. Get Restaurants

```bash
curl -X GET http://localhost:3000/api/restaurants
```

### 6. Get Restaurant Menu

```bash
curl -X GET http://localhost:3000/api/restaurants/1/menu
```

### 7. Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": 1,
    "address_id": 1,
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 2
      },
      {
        "menu_item_id": 2,
        "quantity": 1
      }
    ]
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Order created successfully, awaiting payment.",
  "data": {
    "order_id": 1,
    "status": "PENDING_PAYMENT",
    "total_price": 77000,
    "payment_id": 1
  }
}
```

### 8. Simulate Payment

```bash
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "payment_id": 1,
    "payment_method": "E-Wallet"
  }'
```

### 9. Get Order Status

```bash
curl -X GET http://localhost:3000/api/orders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10. Get All Orders

```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Postman Collection

You can import the following collection into Postman:

1. Create a new collection named "Food Delivery System"
2. Set collection variable `base_url` = `http://localhost:3000/api`
3. Set collection variable `token` = (will be set after login)
4. Add the requests above
5. For authenticated requests, use `{{token}}` in Authorization header

## Swagger UI

Each service has Swagger UI documentation:

- User Service: http://localhost:3001/api-docs
- Restaurant Service: http://localhost:3002/api-docs
- Order Service: http://localhost:3003/api-docs
- Payment Service: http://localhost:3004/api-docs
- Driver Service: http://localhost:3005/api-docs

## Testing with Frontend

1. Start all services
2. Open http://localhost:80 (or http://localhost:5173 for dev)
3. Register/Login
4. Browse restaurants
5. Add items to cart
6. Place order
7. Simulate payment
8. View order status

## Expected Behavior

1. **Order Flow:**
   - Order created → Status: PENDING_PAYMENT
   - Payment simulated → Status: PAID → PREPARING → ON_THE_WAY
   - Driver assigned automatically after payment

2. **Service Communication:**
   - Order Service calls User Service to validate user
   - Order Service calls Restaurant Service to check stock
   - Order Service calls Payment Service to create payment
   - Payment Service calls Order Service webhook after payment
   - Order Service calls Driver Service to assign driver

3. **Database Isolation:**
   - Each service has its own database
   - Services communicate via HTTP API only
   - No direct database access between services

