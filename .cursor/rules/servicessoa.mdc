# Dokumentasi API - Food Delivery System

Selamat datang di Dokumentasi API Food Delivery System. Sistem ini menggunakan arsitektur microservices dengan 5 layanan yang berkomunikasi melalui satu API Gateway.

**Base URL API Gateway:** `http://localhost:3000/api`

## 1. Autentikasi

Sistem ini menggunakan **JSON Web Token (JWT)** untuk mengamankan endpoint.

1.  Dapatkan token dengan melakukan `POST /api/users/auth/login`.
2.  Sertakan token ini pada *header* `Authorization` untuk setiap *request* yang memerlukan autentikasi.
    * **Format:** `Authorization: Bearer <token_anda>`

---

## [A] User Service

Layanan ini mengelola semua fitur yang terkait dengan data pengguna, autentikasi, dan manajemen alamat.

### Fitur 1: Registrasi Pengguna Baru

* **Endpoint:** `POST /users/auth/register`
* **Method:** `POST`
* **Autentikasi:** Tidak perlu.
* **Deskripsi:** Mendaftarkan pengguna baru ke dalam sistem.

**Contoh Request Body:**

```json
{
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "password": "Password123!",
  "phone": "081234567890"
}
```

**Contoh Response Success (201 Created):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi.santoso@example.com"
  }
}
```

**Contoh Response Error (400 Bad Request - Email sudah ada):**
```json
{
  "status": "error",
  "message": "Email already exists"
}
```

### Fitur 2: Login Pengguna

* **Endpoint:** `POST /users/auth/login`
* **Method:** `POST`
* **Autentikasi:** Tidak perlu.
* **Deskripsi:** Mengautentikasi Pengguna dan Mengembalikan JWT Token.

**Contoh Request Body:**
```json
{
  "email": "budi.santoso@example.com",
  "password": "Password123!"
}
```

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Fitur 3: Mendapatkan Profil Pengguna

* **Endpoint:** `GET /users/profile/me`
* **Method:** `GET`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Mengambil detail profil pengguna yang sedang login.

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi.santoso@example.com",
    "phone": "081234567890"
  }
}
```

### Fitur 4: Mengelola Alamat Pengguna

* **Endpoint:** `GET /users/addresses`
* **Method:** `GET`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Mendapatkan daftar alamat yang disimpan oleh pengguna.

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "label": "Rumah",
      "full_address": "Jl. Telekomunikasi No. 1, Bandung"
    },
    {
      "id": 2,
      "label": "Kantor",
      "full_address": "Jl. Gegerkalong Hilir No. 47, Bandung"
    }
  ]
}
```

## [B] Restaurant Service

Layanan ini menyediakan semua informasi publik mengenai restoran dan menu yang mereka tawarkan.

### Fitur 1: Mendapatkan Daftar Restoran

* **Endpoint:** `GET /restaurants`
* **Method:** `GET`
* **Autentikasi:** Tidak perlu.
* **Deskripsi:** Mengambil daftar semua restoran yang tersedia, bisa difilter (misal: berdasarkan lokasi, masakan, dll).

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 101,
      "name": "Sate Padang Asli",
      "cuisine_type": "Padang",
      "address": "Jl. Cihampelas No. 20",
      "is_open": true
    },
    {
      "id": 102,
      "name": "Warung Nasi Sunda",
      "cuisine_type": "Sunda",
      "address": "Jl. Setiabudi No. 50",
      "is_open": true
    }
  ]
}
```

### Fitur 2: Mendapatkan Detail Menu Restoran

* **Endpoint:** `GET /restaurants/{id}/menu`
* **Method:** `GET`
* **Autentikasi:** Tidak perlu.
* **Deskripsi:** Mengambil semua item menu yang tersedia dari satu restoran spesifik berdasarkan `id` restoran.

**Contoh Response Success (200 OK) - untuk `/restaurants/{id}/menu`**
```json
{
  "status": "success",
  "data": {
    "restaurant_name": "Sate Padang Asli",
    "menu_items": [
      {
        "id": 2001,
        "name": "Sate Padang (Daging)",
        "description": "Sate daging sapi dengan kuah kuning kental.",
        "price": 25000,
        "stock": 50,
        "is_available": true
      },
      {
        "id": 2002,
        "name": "Sate Padang (Lidah)",
        "description": "Sate lidah sapi dengan kuah kuning kental.",
        "price": 27000,
        "stock": 30,
        "is_available": true
      }
    ]
  }
}
```

**Contoh Response Error (404 Not Found):**
```json
{
  "status": "error",
  "message": "Restaurant not found"
}
```

## [C] Order Service

Layanan ini adalah inti dari sistem, mengelola proses pembuatan dan pelacakan pesanan.

### Fitur 1: Membuat Pesanan Baru

* **Endpoint:** `POST /orders`
* **Method:** `POST`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Fitur utama untuk membuat pesanan baru. Layanan ini akan berkomunikasi internal dengan User, Restaurant, dan Payment Service.

**Contoh Request Body**
```json
{
  "restaurant_id": 101,
  "address_id": 1,
  "items": [
    {
      "menu_item_id": 2001,
      "quantity": 2
    },
    {
      "menu_item_id": 2002,
      "quantity": 1
    }
  ]
}
```

**Contoh Response Success (201 Created):**
```json
{
  "status": "success",
  "message": "Order created successfully, awaiting payment.",
  "data": {
    "order_id": 5001,
    "status": "PENDING_PAYMENT",
    "total_price": 77000,
    "payment_id": 9001
  }
}
```

**Contoh Response Error (400 Bad Request - Stok habis):**
```json
{
  "status": "error",
  "message": "Failed to create order",
  "details": "Item 'Sate Padang (Lidah)' is out of stock."
}
```

### Fitur 2: Mendapatkan Riwayat Pesanan

* **Endpoint:** `GET /orders`
* **Method:** `GET`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Mengambil daftar riwayat pesanan yang pernah dilakukan oleh pengguna.

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "order_id": 5001,
      "restaurant_name": "Sate Padang Asli",
      "status": "PENDING_PAYMENT",
      "total_price": 77000,
      "created_at": "2025-11-10T10:30:00Z"
    },
    {
      "order_id": 5000,
      "restaurant_name": "Warung Nasi Sunda",
      "status": "DELIVERED",
      "total_price": 50000,
      "created_at": "2025-11-09T19:00:00Z"
    }
  ]
}
```

### Fitur 3: Melacak Status Pesanan Spesifik

* **Endpoint:** `GET /orders/{id}`
* **Method:** `GET`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Mendapatkan detail dan status real-time dari satu pesanan spesifik.

**Contoh Response Success (200 OK) - `untuk /orders/{id}`:**
```json
{
  "status": "success",
  "data": {
    "order_id": 5001,
    "status": "PAID",
    "restaurant_details": {
      "name": "Sate Padang Asli",
      "address": "Jl. Cihampelas No. 20"
    },
    "delivery_address": "Jl. Telekomunikasi No. 1, Bandung",
    "driver_details": {
      "name": "Agus",
      "vehicle": "B 1234 XYZ",
      "phone": "08987654321"
    },
    "items": [
      { "name": "Sate Padang (Daging)", "quantity": 2 },
      { "name": "Sate Padang (Lidah)", "quantity": 1 }
    ],
    "total_price": 77000,
    "estimated_delivery": "2025-11-10T11:00:00Z"
  }
}
```

## [D] Payment Service

Layanan ini mengelola proses pembayaran. Untuk proyek ini, kita fokus pada simulasi pembayaran.

### Fitur 1: (Simulasi) Melakukan Pembayaran

* **Endpoint:** `POST /payments/simulate`
* **Method:** `POST`
* **Autentikasi:** Wajib (Bearer Token).
* **Deskripsi:** Endpoint dummy untuk mensimulasikan bahwa pengguna telah berhasil membayar pesanan.

**Contoh Request Body**
```json
{
  "order_id": 5001,
  "payment_id": 9001,
  "payment_method": "E-Wallet"
}
```

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "message": "Payment successful",
  "data": {
    "payment_id": 9001,
    "order_id": 5001,
    "status": "SUCCESS"
  }
}
```

##### Alur Tersembunyi: Setelah pembayaran ini sukses, Payment Service akan memanggil internal webhook ke Order Service (POST /internal/callback/payment), yang kemudian akan mengubah status order menjadi PAID dan memicu Driver Service untuk mencari kurir.


## [E] Driver Service

Layanan ini umumnya digunakan oleh aplikasi internal kurir. Namun, ada satu fitur publik yang bisa diakses (oleh pengguna kurir).

### Fitur 1: Update Status Kurir

* **Endpoint:** `PUT /drivers/status`
* **Method:** `PUT`
* **Autentikasi:** (Bearer Token - Khusus Akun Driver).
* **Deskripsi:** Digunakan oleh kurir untuk mengubah status ketersediaan mereka (misal: saat mulai bekerja).

**Contoh Request Body**
```json
{
  "status": "AVAILABLE"
}
```

**Contoh Response Success (200 OK):**
```json
{
  "status": "success",
  "message": "Driver status updated",
  "data": {
    "driver_id": 77,
    "name": "Agus",
    "status": "AVAILABLE"
  }
}
```