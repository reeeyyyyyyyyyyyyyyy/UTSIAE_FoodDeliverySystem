# Database Migration Guide - SOA Integration

## Overview
This guide explains how to migrate all databases for the Food Delivery System following SOA (Service-Oriented Architecture) principles. Each service communicates with others via HTTP API calls, not direct database access.

## Migration Order (IMPORTANT!)

**Follow this order to ensure proper SOA integration:**

1. **User Service** - Base service, no dependencies
2. **Restaurant Service** - Independent service
3. **Order Service** - Depends on User Service and Restaurant Service
4. **Payment Service** - Depends on Order Service
5. **Driver Service** - Depends on User Service and Order Service

## Quick Migration (All Services)

**Run this script to migrate all services in correct order:**
```bash
cd food-delivery-project
./migrate-all.sh
```

## Manual Migration Commands

### 1. User Service
```bash
cd food-delivery-project/2-services/01-user-service
# Auto-initializes on first run, no migration needed
```

### 2. Restaurant Service
```bash
cd food-delivery-project/2-services/02-restaurant-service
npm run migrate
```

### 3. Order Service (Clean & Reinitialize)
```bash
cd food-delivery-project/2-services/03-order-service
npm run migrate:fresh
```

### 4. Payment Service
```bash
cd food-delivery-project/2-services/04-payment-service
# Auto-initializes on first run, no migration needed
```

### 5. Driver Service (Clean & Reinitialize with SOA Integration)
```bash
cd food-delivery-project/2-services/05-driver-service
npm run migrate:fresh
```

## What Each Migration Does

### Order Service (migrate:fresh)
- Drops all tables (orders, order_items)
- Recreates tables from init.sql
- **Clean database ready for new orders**

### Driver Service (migrate:fresh)
- Drops all tables (drivers, driver_salaries)
- Recreates tables from init.sql
- **SOA Step 1:** Fetches ALL driver users from `user_service_db` (User Service)
- **SOA Step 2:** Inserts drivers with correct `user_id` matching User Service
- **SOA Step 3:** Resets all `total_earnings` to 0.00 (fresh start)
- **SOA Step 4:** Calculates `total_earnings` from `order_service_db` (Order Service)
  - Only counts orders with `status = 'DELIVERED'`
  - **Driver earns Rp 20,000 per order (fixed rate)**
  - Formula: `total_earnings = total_orders × 20,000`
- **Result:** Driver data fully integrated with User Service and Order Service

## SOA Integration Points

### Driver Service ↔ User Service
- **Driver Service reads from User Service:**
  - Fetches all users with `role = 'driver'` during migration
  - Uses `user_id` to link driver records to user accounts
  - Fetches user details (name, email, phone) via API calls

### Driver Service ↔ Order Service
- **Driver Service reads from Order Service:**
  - Calculates `total_earnings` from delivered orders
  - Fetches active orders (ON_THE_WAY, PREPARING) for driver status
- **Order Service updates Driver Service:**
  - When order is completed (DELIVERED), Order Service calls Driver Service to update earnings
  - Endpoint: `POST /drivers/internal/drivers/:id/update-earnings`
  - **Driver earns Rp 20,000 per order (fixed rate, not based on order total_price)**
  - Formula: `total_earnings += 20,000` per delivered order

### Order Service ↔ Restaurant Service
- **Order Service reads from Restaurant Service:**
  - Validates restaurant and menu items
  - Decreases stock when payment is confirmed
  - Fetches restaurant details for order enrichment

### Order Service ↔ User Service
- **Order Service reads from User Service:**
  - Validates user exists
  - Fetches user addresses
  - Fetches user details for order enrichment

### Order Service ↔ Payment Service
- **Order Service creates payment:**
  - Creates payment record when order is created
  - Receives payment callback when payment is confirmed

## Testing Flow: Customer → Driver → Admin

### Step 1: Customer Creates Order
1. **Login as Customer:**
   - Email: `customer1@example.com`
   - Password: `password123`

2. **Browse Restaurants:**
   - Go to Home/Restaurants
   - Select a restaurant
   - Add items to cart

3. **Create Order:**
   - Select delivery address
   - Click "Place Order"
   - **Expected:** Redirected to Payment page

4. **Complete Payment:**
   - Select payment method
   - Click "Confirm Payment"
   - **Expected:** Redirected to Invoice page
   - **Expected:** Order status = "PREPARING"
   - **Expected:** Stock decreased in Restaurant Service

### Step 2: Driver Accepts Order
1. **Login as Driver:**
   - Email: `driver@example.com` (Driver Test)
   - Password: `password123`

2. **View Available Orders:**
   - Go to Driver Dashboard
   - **Expected:** See order with status "PREPARING"
   - **Expected:** Notification badge shows new order

3. **Accept Order:**
   - Click "Accept Order" on available order
   - **Expected:** Order status = "ON_THE_WAY"
   - **Expected:** Order appears in "My Orders" section

4. **Complete Order:**
   - After delivery, click "Mark as Delivered"
   - **Expected:** Order status = "DELIVERED"
   - **Expected:** Driver `total_earnings` updated in Driver Service
   - **Expected:** Order disappears from available orders

### Step 3: Admin Tracks Everything
1. **Login as Admin:**
   - Email: `admin@example.com`
   - Password: `password123`

2. **Track Orders:**
   - Go to Admin Menu → Track Orders
   - **Expected:** See all orders with:
     - Restaurant name (from Restaurant Service)
     - Customer name & email (from User Service)
     - Driver name & email (from Driver Service via User Service)
     - Status, price, delivery time

3. **Track Drivers:**
   - Go to Admin Menu → Track Drivers
   - **Expected:** See all drivers with:
     - Name, email, phone (from User Service)
     - Active orders count (from Order Service)
     - Total earnings (from Order Service - DELIVERED orders)
     - Status: "Busy" if has ON_THE_WAY orders, "Available" if not

4. **Driver Salaries:**
   - Go to Admin Menu → Driver Salaries
   - **Expected:** See two tables:
     - **Top table:** All salary records with details (Base Salary, Commission, Total Orders, Total Amount, Status)
     - **Bottom table:** All drivers with real-time data (Total Earnings, Active Orders) and action buttons
   - In bottom table, select period (Year and Month) for a driver, click "Create Salary"
   - **Expected:** Salary calculated from:
     - Base salary: Rp 2,000,000 (fixed)
     - Commission: Rp 20,000 × total_orders (from Order Service for that period)
     - Total orders: Count from Order Service for that period
     - Total amount: Base salary + Commission
   - In top table, click "Mark as Paid" for PENDING salaries
   - **Expected:** Status changes to "PAID"
   - **Expected:** Real-time updates every 5 seconds (SOA communication)

5. **Sales Statistics:**
   - Go to Admin Menu → Sales Statistics
   - **Expected:** See:
     - Total orders, revenue (from Order Service)
     - All restaurants with sales (from Restaurant Service + Order Service)
     - Restaurants with 0 sales still appear (from Restaurant Service)

## Verification Checklist

After migration, verify:

- [ ] All services are running (check logs)
- [ ] User Service has users (admin, customer, driver)
- [ ] Restaurant Service has restaurants and menu items
- [ ] Order Service database is clean (no old orders)
- [ ] Driver Service has drivers matching User Service drivers
- [ ] Driver `total_earnings` = 0 (will update when orders are completed)
- [ ] All SOA endpoints are accessible (no 403/404 errors)

## Troubleshooting

### Driver Service shows "Available" but driver has orders
- **Check:** Order Service logs for SOA calls
- **Check:** Driver Service logs for 403/404 errors
- **Fix:** Ensure internal endpoints don't require authentication

### Driver earnings not updating
- **Check:** Order Service calls Driver Service on order completion
- **Check:** Driver Service internal endpoint `/internal/drivers/:id/update-earnings` exists
- **Fix:** Verify SOA communication is working

### Duplicate orders
- **Check:** Order Service has duplicate prevention
- **Fix:** Run `npm run migrate:fresh` on Order Service

### Driver salaries show wrong data
- **Check:** Salary calculation uses Order Service data
- **Fix:** Recreate salary after ensuring orders are in Order Service

## Notes

- **Never access another service's database directly** (except during migration scripts)
- **Always use HTTP API calls** for service-to-service communication
- **Internal endpoints** don't require authentication (service-to-service)
- **Public endpoints** require authentication (user-facing)

