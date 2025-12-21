# MIGRATION BLUEPRINT: FROM REST TO MICROSERVICES WITH GRAPHQL & DOCKER

## 1. Project Context (Current State)
We currently have a **Food Delivery System** based on Service-Oriented Architecture (SOA).
- **Tech Stack:** Node.js (Express), TypeScript, MySQL (TypeORM/Sequelize).
- **Communication:** Currently using REST API (HTTP).
- **Structure:** Monorepo with `1-api-gateway` and `2-services` (User, Order, Restaurant, Payment, Driver).
- **Running Method:** Currently running via `start-all.sh` (local).
- **Constraint:** We need to keep the existing business logic (Services/Controllers) but **expose** the data via GraphQL.

## 2. Target Goal (The Requirement)
We need to transform this project to meet the "Enterprise Application Integration" course requirements:
1.  **GraphQL Implementation:** The main communication layer between Frontend and Backend MUST be GraphQL.
2.  **Dockerization:** The system must run fully using `docker-compose up --build`.
3.  **Role Division:**
    - **Me (Current User):** Responsible for **User Service**, **Order Service**, and **Restaurant Service** (The 3 most complex services).
    - **Others:** Payment and Driver services (handled by teammates, keep them simple or mock them for now).
4.  **External Integration:**
    - **Order Service** must integrate with an External Team's Service (**DOSWallet**) via their GraphQL Endpoint for payments.

## 3. Step-by-Step Instructions for Copilot

### PHASE 1: GraphQL Conversion (Apollo Server)
**Target:** Convert `User Service`, `Order Service`, and `Restaurant Service` to use Apollo Server over Express.

**Instruction for each service:**
1.  **Install Dependencies:** Add `apollo-server-express`, `graphql`, `class-validator`, and `reflect-metadata`.
2.  **Schema Definition (TypeDefs):**
    - Create a `schema` folder.
    - Translate the existing REST DTOs/Models into GraphQL Types (`type User { ... }`, `type Order { ... }`).
3.  **Resolvers:**
    - Create a `resolvers` folder.
    - **Query:** Map `GET` endpoints to Queries (e.g., `getUser(id)` calls `UserService.findById`).
    - **Mutation:** Map `POST/PUT/DELETE` endpoints to Mutations (e.g., `createOrder(input)` calls `OrderService.create`).
    - *Crucial:* Do not rewrite business logic. Import the existing Controllers/Services and call their methods inside the resolvers.
4.  **Entry Point (`index.ts`):**
    - Initialize `ApolloServer`.
    - Apply it as middleware to the existing Express `app` (e.g., `server.applyMiddleware({ app })`).
    - Ensure the REST endpoints still work if needed for debugging, but the main entry is `/graphql`.

### PHASE 2: Docker & Networking Fixes
**Problem:** Currently running on local script. `docker-compose` might fail due to networking issues (localhost vs container name).

**Instructions:**
1.  **Review `docker-compose.yml`:**
    - Ensure all services (User, Order, Restaurant, DBs) are on the same bridge network (e.g., `food-delivery-network`).
    - Ensure Environment Variables in `docker-compose.yml` point to **Service Names**, NOT `localhost`.
      - *Example:* `USER_SERVICE_URL=http://user-service:3001` (Correct) vs `http://localhost:3001` (Wrong inside container).
2.  **Database Connection:**
    - Ensure `DB_HOST` in `.env` or docker config uses the container name of the database (e.g., `mysql_user_db`).
3.  **Verification Script:**
    - Create a script or instruction to test if the containers can ping each other.

### PHASE 3: External Integration (DOSWallet)
**Context:** The `Order Service` needs to check balance/pay using the External DOSWallet GraphQL API.

**Instructions:**
1.  **External Schema:**
    - Assume DOSWallet endpoint is reachable.
    - We need to consume their GraphQL Query: `checkPayment(nim: String!)` or mutation for payment.
2.  **Implementation in Order Service:**
    - In `OrderService` (backend logic), when an order is placed:
    - Use `graphql-request` or `axios` to send a POST request to the DOSWallet GraphQL URL.
    - Validate the response before creating the order.

## 4. Acceptance Criteria (Definition of Done)
1.  I can run `docker-compose up --build` and all containers (3 Services + DBs + Gateway) start without error.
2.  I can open `http://localhost:3000/graphql` (Gateway) or `http://localhost:3001/graphql` (User Service) and see the Apollo Sandbox/Playground.
3.  I can execute a `login` mutation and get a JWT token via GraphQL.
4.  I can execute a `createOrder` mutation via GraphQL.

---
**Copilot, please start by analyzing the `docker-compose.yml` and `index.ts` of the User Service to implement Phase 1.**