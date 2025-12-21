# FAST TRACK: CLEAN GRAPHQL MIGRATION FOR IAE PROJECT

## 1. Context & Objective
We are migrating an existing "Food Delivery System" to a **GraphQL-First Microservices Architecture** to meet university project requirements.
**Previous Attempt Status:** Failed/Too slow due to monolith complexity.
**Current Strategy:** **"Clean Core Rebuild"**. We will create a new, lightweight folder structure and migrate ONLY the essential logic (Models & Services) from the old project into a fresh, GraphQL-native setup.

## 2. The Scope (Strictly 3 Services)
We focus ONLY on the services owned by "Muhammad Rayhan":
1.  **Auth/User Service:** JWT handling, User profile.
2.  **Restaurant Service:** Menu management.
3.  **Order Service (The Core):** Transaction logic + **Integration with External Payment**.

*Note: Frontend, Driver Service, and legacy REST endpoints are OUT OF SCOPE for this migration.*

## 3. Technical Requirements
-   **Runtime:** Node.js + TypeScript.
-   **Framework:** Apollo Server (Standalone) or Express + Apollo Server.
-   **Communication:** 100% GraphQL for client-server.
-   **Database:** MySQL (One DB per service).
-   **Infrastructure:** Docker & Docker Compose.
-   **External Integration:** Order Service MUST communicate with `DOSWallet` (External Team) via their GraphQL Endpoint.

## 4. Step-by-Step Implementation Guide for Agent

### STEP 1: Scaffolding (Create this structure FIRST)
Create a new root folder named `iae-backend-core`. Inside it:
```text
iae-backend-core/
├── user-service/       (Port 4001)
├── restaurant-service/ (Port 4002)
├── order-service/      (Port 4003)
└── docker-compose.yml
```
## Docker Requirement:

### 1. Create docker-compose.yml defining 3 MySQL containers (user_db, restaurant_db, order_db) and the 3 Node.js services.

### 2. Ensure they are on the same network iae-network.

### 3. Use service names for communication (e.g., DB_HOST=user_db not localhost).

## STEP 2: Service Implementation

### A. User Service (Port 4001)
**Goal:** User Registration & Login (JWT Issue).

**Action:**
- Copy User model logic from old project.
- Create typeDefs:
  - `type User { id, name, email, role }`
  - `input RegisterInput`
  - `type AuthPayload { token, user }`
- Create resolvers:
  - `Mutation.register(input: RegisterInput): AuthPayload`
  - `Mutation.login(email, password): AuthPayload (Return a valid JWT)`
  - `Mutation.login(email, password): AuthPayload (Return a valid JWT)`
- **Important:** Returns a JWT token that other services will decode.

---

### B. Restaurant Service (Port 4002)
**Goal:** Display Restaurants & Menu.

**Action:**
- Copy Restaurant and MenuItem model logic.
- Create typeDefs:
  - `type Restaurant { id, name, address }`
  - `type Menu { id, name, price, restaurantId }`
- Create resolvers:
  - `Query.restaurants: [Restaurant]`
  - `Query.menu(restaurantId): [Menu]`
  - `Mutation.createRestaurant(...) (For seeding data)`
---

### C. Order Service (Port 4003) – COMPLEXITY HIGH
**Goal:** Create Order 

**Action:**
- Copy Restaurant and MenuItem model logic.
- Create typeDefs:
  - `type Order { id, userId, restaurantId, totalAmount, status }`
- Create resolvers:
  - `Mutation.createOrder(input: OrderInput): Order`
  - `Query.menu(restaurantId): [Menu]`
  - `Mutation.createRestaurant(...) (For seeding data)`
- Mock Integration Strategy:
  - Since the Partner's Payment Service is not ready, DO NOT attempt to call their real API yet.
  - Action: Create a dummy function checkPaymentExternal() that simply returns true (success) or "PAID".
  - We will replace this mock with a real HTTP call in the next phase.
---

## STEP 3: Docker Composition

Generate a `docker-compose.yml` that:
- Spins up 3 MySQL containers:
  - `user_db`
  - `restaurant_db`
  - `order_db`
- Spins up the 3 Node.js services.
- Puts them on a shared network `iae-network`.
- Exposes ports:
  - `4001`
  - `4002`
  - `4003` to host.

---

## STEP 4: Testing Queries (For User Verification)

Once the system is running, the user will test using these GraphQL operations. Ensure your code supports them.

### 1. Auth (User Service)
```graphql
mutation Register {
  register(input: {name: "Rayhan", email: "rayhan@test.com", password: "123", role: "CUSTOMER"}) {
    token
    user { name }
  }
}

mutation Login {
  login(email: "rayhan@test.com", password: "password123") {
    token
    user {
      id
      name
    }
  }
}
```

### 2. Browse (Restaurant Service)
```graphql
query GetRestaurants {
  restaurants {
    id
    name
    menus {
      id
      name
      price
    }
  }
}
```

### 3. Create Order (With Mocked Payment)
```graphql
mutation CreateOrder {
  createOrder(input: {
    restaurantId: "1",
    items: [{menuId: "A1", qty: 2}]
  }) {
    id
    status # Should be "PAID" (Mocked)
    totalAmount
  }
}
```
