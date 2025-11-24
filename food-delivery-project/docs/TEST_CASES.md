# 📋 Test Cases - Food Delivery System
## User Flow: Pemesanan & Cek Order

**Project:** Food Delivery System  
**Testing Type:** E2E (End-to-End) Testing  
**Tool:** Cypress  
**Date:** 2024  
**Tester:** Muhammad Rayhan Ramadhan

---

## 📊 Test Case Summary

| Category | Total | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| Functional Testing | 15 | - | - | ⏳ Pending |
| Non-Functional Testing | 8 | - | - | ⏳ Pending |
| **TOTAL** | **23** | **-** | **-** | **⏳ Pending** |

---

## 🎯 Functional Test Cases

### TC-001: User Registration
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melakukan registrasi dengan data valid

**Pre-conditions:**
- User belum terdaftar
- Browser dibuka di halaman Welcome/Login

**Test Steps:**
1. Buka aplikasi di browser
2. Klik tombol "Daftar" atau navigasi ke halaman register
3. Isi form dengan data valid:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "password123"
   - Phone: "081234567890"
4. Klik tombol "Register" atau "Daftar"

**Expected Result:**
- User berhasil terdaftar
- Redirect ke halaman home/dashboard
- Token JWT tersimpan di localStorage
- User data tersimpan di localStorage

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-002: User Login dengan Credentials Valid
**Priority:** High  
**Type:** Functional  
**Description:** User dapat login dengan email dan password yang benar

**Pre-conditions:**
- User sudah terdaftar
- User memiliki akun dengan email dan password valid

**Test Steps:**
1. Buka aplikasi di browser
2. Navigasi ke halaman login
3. Input email: "testuser@example.com"
4. Input password: "password123"
5. Klik tombol "Login"

**Expected Result:**
- Login berhasil
- Redirect ke halaman home/dashboard
- Token JWT tersimpan di localStorage
- User data tersimpan di localStorage
- Navbar menampilkan nama user

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-003: User Login dengan Credentials Invalid
**Priority:** High  
**Type:** Functional  
**Description:** User tidak dapat login dengan email atau password yang salah

**Test Steps:**
1. Buka aplikasi di browser
2. Navigasi ke halaman login
3. Input email: "wrong@example.com"
4. Input password: "wrongpassword"
5. Klik tombol "Login"

**Expected Result:**
- Login gagal
- Menampilkan error message
- Tidak redirect ke halaman lain
- Token tidak tersimpan di localStorage

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-004: Browse Restaurants
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melihat daftar restoran yang tersedia

**Pre-conditions:**
- User sudah login
- Ada restoran yang terdaftar di sistem

**Test Steps:**
1. Login sebagai user
2. Navigasi ke halaman "Browse" atau "Home"
3. Tunggu hingga daftar restoran dimuat

**Expected Result:**
- Halaman menampilkan daftar restoran
- Setiap restoran menampilkan:
  - Nama restoran
  - Tipe cuisine
  - Alamat
  - Status (buka/tutup)
  - Gambar (jika ada)
- User dapat scroll untuk melihat lebih banyak restoran

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-005: Filter Restaurants by Cuisine Type
**Priority:** Medium  
**Type:** Functional  
**Description:** User dapat memfilter restoran berdasarkan tipe cuisine

**Pre-conditions:**
- User sudah login
- User berada di halaman browse restaurants

**Test Steps:**
1. Navigasi ke halaman browse restaurants
2. Klik filter "Padang" (atau cuisine type lainnya)
3. Tunggu hasil filter dimuat

**Expected Result:**
- Halaman hanya menampilkan restoran dengan tipe cuisine "Padang"
- Filter button menunjukkan state aktif
- Daftar restoran ter-update sesuai filter

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-006: View Restaurant Detail
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melihat detail restoran dan menu items

**Pre-conditions:**
- User sudah login
- User berada di halaman browse restaurants

**Test Steps:**
1. Klik pada salah satu card restoran
2. Tunggu halaman detail restoran dimuat

**Expected Result:**
- Halaman detail restoran ditampilkan
- Menampilkan informasi restoran:
  - Nama restoran
  - Tipe cuisine
  - Alamat
  - Status (buka/tutup)
- Menampilkan daftar menu items dengan:
  - Nama menu
  - Deskripsi
  - Harga
  - Gambar (jika ada)
  - Tombol "Add to Cart"

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-007: Add Menu Item to Cart
**Priority:** High  
**Type:** Functional  
**Description:** User dapat menambahkan menu item ke cart

**Pre-conditions:**
- User sudah login
- User berada di halaman detail restoran
- Restoran memiliki menu items

**Test Steps:**
1. Navigasi ke halaman detail restoran
2. Klik tombol "Add to Cart" pada salah satu menu item
3. Verifikasi item ditambahkan ke cart

**Expected Result:**
- Menu item berhasil ditambahkan ke cart
- Cart sidebar menampilkan item yang ditambahkan
- Quantity item di cart adalah 1
- Total price ter-update
- Tombol "Add to Cart" berubah menjadi "+" dan "-" untuk quantity

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-008: Update Cart Item Quantity
**Priority:** Medium  
**Type:** Functional  
**Description:** User dapat menambah atau mengurangi quantity item di cart

**Pre-conditions:**
- User sudah login
- User memiliki item di cart

**Test Steps:**
1. Buka cart sidebar
2. Klik tombol "+" untuk menambah quantity
3. Klik tombol "-" untuk mengurangi quantity

**Expected Result:**
- Quantity item ter-update
- Total price ter-update sesuai quantity
- Jika quantity = 0, item dihapus dari cart

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-009: Remove Item from Cart
**Priority:** Medium  
**Type:** Functional  
**Description:** User dapat menghapus item dari cart

**Pre-conditions:**
- User sudah login
- User memiliki item di cart

**Test Steps:**
1. Buka cart sidebar
2. Klik tombol "Remove" atau "X" pada item

**Expected Result:**
- Item dihapus dari cart
- Cart sidebar ter-update
- Total price ter-update

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-010: Create Order (Checkout)
**Priority:** High  
**Type:** Functional  
**Description:** User dapat membuat order dari cart

**Pre-conditions:**
- User sudah login
- User memiliki item di cart
- User memiliki alamat pengiriman

**Test Steps:**
1. Buka cart sidebar
2. Pilih alamat pengiriman (jika belum ada, buat alamat baru)
3. Klik tombol "Checkout" atau "Pesan Sekarang"
4. Tunggu proses order selesai

**Expected Result:**
- Order berhasil dibuat
- Redirect ke halaman payment
- Order ID ditampilkan
- Payment ID ditampilkan
- Cart dikosongkan

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-011: Simulate Payment
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melakukan simulasi pembayaran

**Pre-conditions:**
- User sudah membuat order
- User berada di halaman payment

**Test Steps:**
1. Setelah order dibuat, user di-redirect ke halaman payment
2. Klik tombol "Bayar Sekarang" atau "Simulate Payment"
3. Tunggu proses pembayaran selesai

**Expected Result:**
- Pembayaran berhasil
- Redirect ke halaman invoice atau order status
- Status order berubah menjadi "PAID"
- Invoice ditampilkan dengan detail order

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-012: View Order List
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melihat daftar semua order yang pernah dibuat

**Pre-conditions:**
- User sudah login
- User memiliki minimal 1 order

**Test Steps:**
1. Login sebagai user
2. Navigasi ke halaman "Orders" atau "Pesanan Saya"
3. Tunggu daftar order dimuat

**Expected Result:**
- Halaman menampilkan daftar semua order
- Setiap order menampilkan:
  - Order ID atau Order Code
  - Nama restoran
  - Status order
  - Total price
  - Tanggal order
- User dapat klik pada order untuk melihat detail

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-013: View Order Detail/Status
**Priority:** High  
**Type:** Functional  
**Description:** User dapat melihat detail dan status order

**Pre-conditions:**
- User sudah login
- User memiliki minimal 1 order

**Test Steps:**
1. Navigasi ke halaman orders
2. Klik pada salah satu order
3. Tunggu halaman detail order dimuat

**Expected Result:**
- Halaman detail order ditampilkan
- Menampilkan informasi order:
  - Order Code
  - Status order (dengan visual indicator)
  - Nama restoran
  - Alamat pengiriman
  - Daftar menu items yang dipesan
  - Total price
  - Driver information (jika sudah di-assign)
  - Timeline status order

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-014: Order Status Updates
**Priority:** Medium  
**Type:** Functional  
**Description:** Status order dapat berubah sesuai alur (PENDING_PAYMENT → PAID → PREPARING → ON_THE_WAY → DELIVERED)

**Pre-conditions:**
- User sudah membuat order
- Order sudah dibayar

**Test Steps:**
1. Buat order dan lakukan pembayaran
2. Refresh halaman order status
3. Verifikasi status order ter-update

**Expected Result:**
- Status order berubah sesuai alur:
  - PENDING_PAYMENT → PAID (setelah payment)
  - PAID → PREPARING (setelah restaurant accept)
  - PREPARING → ON_THE_WAY (setelah driver assigned)
  - ON_THE_WAY → DELIVERED (setelah driver complete)
- Visual indicator (stepper/timeline) ter-update
- Status badge berubah warna sesuai status

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-015: Logout
**Priority:** Medium  
**Type:** Functional  
**Description:** User dapat logout dari aplikasi

**Pre-conditions:**
- User sudah login

**Test Steps:**
1. Klik tombol "Logout" di navbar atau profile
2. Konfirmasi logout (jika ada)

**Expected Result:**
- User berhasil logout
- Token dihapus dari localStorage
- User data dihapus dari localStorage
- Redirect ke halaman welcome/login
- User tidak dapat mengakses halaman yang memerlukan authentication

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

## ⚡ Non-Functional Test Cases

### TC-016: Page Load Performance
**Priority:** Medium  
**Type:** Non-Functional (Performance)  
**Description:** Halaman harus dimuat dalam waktu yang wajar (< 3 detik)

**Test Steps:**
1. Buka aplikasi di browser
2. Ukur waktu load halaman home
3. Ukur waktu load halaman browse restaurants
4. Ukur waktu load halaman detail restoran

**Expected Result:**
- Halaman home dimuat dalam < 3 detik
- Halaman browse restaurants dimuat dalam < 3 detik
- Halaman detail restoran dimuat dalam < 3 detik
- Tidak ada blocking resources

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-017: API Response Time
**Priority:** Medium  
**Type:** Non-Functional (Performance)  
**Description:** API response time harus < 2 detik untuk operasi normal

**Test Steps:**
1. Monitor network requests saat:
   - Login
   - Fetch restaurants
   - Fetch menu items
   - Create order
   - Fetch orders

**Expected Result:**
- Login API response < 2 detik
- Fetch restaurants API response < 2 detik
- Fetch menu items API response < 2 detik
- Create order API response < 3 detik
- Fetch orders API response < 2 detik

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-018: Responsive Design (Mobile)
**Priority:** Medium  
**Type:** Non-Functional (Usability)  
**Description:** Aplikasi harus responsive dan dapat digunakan di mobile device

**Test Steps:**
1. Buka aplikasi di browser
2. Ubah viewport ke mobile size (375x667 atau 390x844)
3. Test navigasi dan interaksi di mobile view

**Expected Result:**
- Layout menyesuaikan dengan mobile viewport
- Text dapat dibaca dengan jelas
- Button dapat diklik dengan mudah
- Form dapat diisi dengan mudah
- Tidak ada horizontal scroll yang tidak perlu
- Navbar responsive (hamburger menu jika perlu)

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-019: Responsive Design (Tablet)
**Priority:** Low  
**Type:** Non-Functional (Usability)  
**Description:** Aplikasi harus responsive dan dapat digunakan di tablet device

**Test Steps:**
1. Buka aplikasi di browser
2. Ubah viewport ke tablet size (768x1024)
3. Test navigasi dan interaksi di tablet view

**Expected Result:**
- Layout menyesuaikan dengan tablet viewport
- Grid layout menampilkan lebih banyak kolom
- Sidebar dapat digunakan dengan baik
- Tidak ada elemen yang terlalu besar atau kecil

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-020: Error Handling - Network Error
**Priority:** High  
**Type:** Non-Functional (Reliability)  
**Description:** Aplikasi harus menampilkan error message yang jelas saat terjadi network error

**Test Steps:**
1. Stop backend services
2. Coba lakukan operasi yang memerlukan API call (login, fetch restaurants, dll)

**Expected Result:**
- Menampilkan error message yang jelas
- Error message informatif (misal: "Network error. Please check your connection.")
- User tidak melihat error technical yang membingungkan
- Aplikasi tidak crash

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-021: Error Handling - Invalid Input
**Priority:** High  
**Type:** Non-Functional (Reliability)  
**Description:** Aplikasi harus menampilkan error message yang jelas saat input tidak valid

**Test Steps:**
1. Coba login dengan email tidak valid (tanpa @)
2. Coba register dengan password terlalu pendek
3. Coba checkout tanpa memilih alamat

**Expected Result:**
- Menampilkan error message yang jelas
- Error message informatif
- Form validation bekerja dengan baik
- User tahu apa yang harus diperbaiki

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-022: Loading States
**Priority:** Medium  
**Type:** Non-Functional (Usability)  
**Description:** Aplikasi harus menampilkan loading indicator saat melakukan operasi async

**Test Steps:**
1. Login (perhatikan loading state)
2. Fetch restaurants (perhatikan loading state)
3. Create order (perhatikan loading state)
4. Fetch orders (perhatikan loading state)

**Expected Result:**
- Loading indicator ditampilkan saat operasi async
- Loading indicator jelas dan tidak membingungkan
- User tahu bahwa aplikasi sedang memproses
- Loading tidak terlalu lama (timeout handling)

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

### TC-023: Browser Compatibility
**Priority:** Low  
**Type:** Non-Functional (Compatibility)  
**Description:** Aplikasi harus dapat digunakan di browser modern (Chrome, Firefox, Safari, Edge)

**Test Steps:**
1. Test aplikasi di Chrome
2. Test aplikasi di Firefox
3. Test aplikasi di Safari
4. Test aplikasi di Edge

**Expected Result:**
- Aplikasi berfungsi dengan baik di semua browser modern
- Tidak ada error console yang signifikan
- UI/UX konsisten di semua browser
- Fitur utama berfungsi di semua browser

**Actual Result:** ⏳ Pending  
**Status:** ⏳ Not Executed  
**Pass/Fail:** ⏳ -

---

## 📝 Test Execution Notes

### Environment
- **Base URL:** http://localhost:5173 (Frontend)
- **API Gateway:** http://localhost:3000
- **Browser:** Chrome (latest)
- **Screen Resolution:** 1920x1080

### Test Data
- **Test User Email:** testuser@example.com
- **Test User Password:** password123
- **Test Restaurant ID:** 1 (atau ID yang tersedia)

### Dependencies
- Semua backend services harus running
- Database harus ter-initialize dengan data sample
- API Gateway harus running

---

## ✅ Test Execution Log

| Test Case ID | Date | Tester | Status | Pass/Fail | Notes |
|--------------|------|--------|--------|-----------|-------|
| TC-001 | - | - | ⏳ Not Executed | - | - |
| TC-002 | - | - | ⏳ Not Executed | - | - |
| TC-003 | - | - | ⏳ Not Executed | - | - |
| ... | ... | ... | ... | ... | ... |

---

## 📊 Test Metrics

- **Total Test Cases:** 23
- **Executed:** 0
- **Passed:** 0
- **Failed:** 0
- **Pass Rate:** 0%
- **Coverage:** User Flow (Pemesanan & Cek Order)

---

**Last Updated:** 2024  
**Next Review:** After test execution
