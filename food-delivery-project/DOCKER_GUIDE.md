# 🐳 Panduan Docker - Food Delivery System

## Prerequisites

1. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Install dan start Docker Desktop
   - Verify: `docker --version`

2. **Install Docker Compose** (biasanya sudah included di Docker Desktop)
   - Verify: `docker-compose --version`

## Langkah-langkah Menjalankan dengan Docker

### Step 1: Pastikan Docker Running

```bash
# Check Docker status
docker ps

# Jika error, start Docker Desktop
```

### Step 2: Masuk ke Direktori Proyek

```bash
cd "/Users/rayyyhann/Documents/IAE UTS/food-delivery-project"
```

### Step 3: Build dan Start Semua Services

```bash
# Build dan start semua services (termasuk 5 database MySQL)
docker-compose up --build

# Atau run di background (detached mode)
docker-compose up -d --build
```

### Step 4: Tunggu Services Ready

Tunggu beberapa saat sampai semua services running. Check dengan:

```bash
# Check status semua containers
docker-compose ps

# Check logs
docker-compose logs -f
```

### Step 5: Akses Aplikasi

Setelah semua services running:

- **Frontend**: http://localhost:80
- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Swagger Docs**:
  - User Service: http://localhost:3001/api-docs
  - Restaurant Service: http://localhost:3002/api-docs
  - Order Service: http://localhost:3003/api-docs
  - Payment Service: http://localhost:3004/api-docs
  - Driver Service: http://localhost:3005/api-docs

## Perintah Docker yang Berguna

### View Logs

```bash
# Semua logs
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f frontend
docker-compose logs -f mysql-user

# Last 100 lines
docker-compose logs --tail=100 api-gateway
```

### Stop Services

```bash
# Stop semua services (tapi keep containers)
docker-compose stop

# Stop dan remove containers
docker-compose down

# Stop dan remove containers + volumes (hapus database data)
docker-compose down -v
```

### Restart Services

```bash
# Restart semua services
docker-compose restart

# Restart specific service
docker-compose restart user-service
docker-compose restart api-gateway
```

### Rebuild Services

```bash
# Rebuild semua services
docker-compose up --build

# Rebuild specific service
docker-compose up --build user-service

# Rebuild tanpa cache
docker-compose build --no-cache
```

### Check Status

```bash
# List semua containers
docker-compose ps

# Check resource usage
docker stats

# Check specific container
docker inspect api-gateway
```

### Execute Commands in Container

```bash
# Bash into container
docker-compose exec api-gateway sh
docker-compose exec user-service sh

# Run command in container
docker-compose exec user-service npm run build
```

## Troubleshooting

### Port Already in Use

```bash
# Check port usage
lsof -i :3000
lsof -i :80
lsof -i :3307

# Kill process
kill -9 <PID>

# Atau change port di docker-compose.yml
```

### Database Connection Error

```bash
# Check database containers
docker-compose ps | grep mysql

# Check database logs
docker-compose logs mysql-user
docker-compose logs mysql-restaurant

# Restart database
docker-compose restart mysql-user
```

### Container Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Out of Memory

```bash
# Check Docker resources
docker stats

# Increase Docker Desktop memory limit
# Docker Desktop -> Settings -> Resources -> Memory
```

### Clean Up

```bash
# Remove all containers, networks, volumes
docker-compose down -v

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Database Access

### Connect to Database dari Host

```bash
# User Service DB
mysql -h 127.0.0.1 -P 3307 -u user_service -puser_service_pass user_service_db

# Restaurant Service DB
mysql -h 127.0.0.1 -P 3308 -u restaurant_service -prestaurant_service_pass restaurant_service_db

# Order Service DB
mysql -h 127.0.0.1 -P 3309 -u order_service -porder_service_pass order_service_db

# Payment Service DB
mysql -h 127.0.0.1 -P 3310 -u payment_service -ppayment_service_pass payment_service_db

# Driver Service DB
mysql -h 127.0.0.1 -P 3311 -u driver_service -pdriver_service_pass driver_service_db
```

### Connect dari Container

```bash
# Connect to MySQL container
docker-compose exec mysql-user mysql -u user_service -puser_service_pass user_service_db
```

## Environment Variables

Environment variables sudah di-set di `docker-compose.yml`. Jika ingin mengubah:

1. Edit `docker-compose.yml`
2. Atau buat file `.env` di root project
3. Rebuild: `docker-compose up --build`

## Production Deployment

Untuk production:

1. Update environment variables
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up proper database backups
5. Use container orchestration (Kubernetes)
6. Set up monitoring and logging

## Useful Commands Summary

```bash
# Start semua services
docker-compose up --build

# Start di background
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart <service-name>

# Rebuild service
docker-compose up --build <service-name>

# Check status
docker-compose ps

# Clean up
docker-compose down -v
```

## Next Steps

Setelah semua services running:

1. Test API: http://localhost:3000/health
2. Register user: http://localhost:80
3. Login dan test order flow
4. Check Swagger docs untuk API documentation

Untuk testing, lihat `API_TESTING.md`.

