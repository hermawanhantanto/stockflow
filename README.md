# Stockflow

Stockflow is an inventory and sales order management system designed for tracking product stock, handling warehouse movements, placing customer orders, and managing order cancellations with automatic stock restoration.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Go (1.22 or later)
- Node.js (18 or later) and npm

### 1. Start the Database

From the root directory, run:

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5433`. The initial schema (`backend/db/01_schema.sql`) and seed data (`backend/db/02_seed.sql`) are automatically applied upon container creation.

### 2. Start the Backend API

In a new terminal window:

```bash
cd backend
go run main.go
```

The backend server will start at `http://localhost:8080`.

### 3. Start the Frontend Application

In another terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend web application will start at `http://localhost:5173`.

---

## API Endpoints and curl Examples

### 1. List Products

Fetches paginated products with optional search query and active status filter.

```bash
curl -s "http://localhost:8080/api/products?page=1&limit=10&status=active&search=ThinkPad"
```

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": 1,
      "sku": "SKU-LAP-001",
      "name": "ThinkPad T14 Gen 4 Laptop",
      "price": 18500000,
      "stock": 25,
      "is_active": true,
      "created_at": "2026-10-28T04:38:34.689767Z",
      "last_movement_at": "2026-10-28T04:38:34.694431Z"
    }
  ],
  "limit": 10,
  "page": 1,
  "total": 1
}
```

### 2. Adjust Product Stock

Records a manual stock adjustment (`in` for restock, `out` for deduction).

```bash
curl -s -X POST http://localhost:8080/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{"type": "in", "qty": 10, "text": "Restock shipment #104"}'
```

Response (`200 OK`):

```json
{
  "message": "Stock updated successfully",
  "new_stock": 35
}
```

Attempting to deduct more stock than available returns `409 Conflict`:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "available": 25
  }
}
```

### 3. Get Product Stock Movements

Retrieves audit history of all stock movements for a specific product.

```bash
curl -s http://localhost:8080/api/products/1/movements
```

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "type": "in",
      "qty": 25,
      "note": "Initial warehouse stock",
      "created_at": "2026-10-23T04:38:34.694431Z"
    }
  ]
}
```

### 4. Create Sales Order

Places an order for one or more items. The backend computes the total and verifies stock availability within a single database transaction.

```bash
curl -s -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "PT Maju Bersama",
    "items": [
      { "sku": "SKU-LAP-001", "qty": 2 },
      { "sku": "SKU-MON-002", "qty": 1 }
    ]
  }'
```

Response (`201 Created`):

```json
{
  "id": 4,
  "customer": "PT Maju Bersama",
  "status": "CREATED",
  "total": 44200000,
  "created_at": "2026-10-28T14:36:37.758001Z",
  "cancelled_at": null,
  "items": [
    { "id": 6, "order_id": 4, "sku": "SKU-LAP-001", "qty": 2, "unit_price": 18500000 },
    { "id": 7, "order_id": 4, "sku": "SKU-MON-002", "qty": 1, "unit_price": 7200000 }
  ]
}
```

If any SKU has insufficient inventory, the entire transaction is rolled back and returns `409 Conflict`:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "sku": "SKU-LAP-001",
    "available": 1
  }
}
```

### 5. Get Order Details

Fetches order information and line items by order ID.

```bash
curl -s http://localhost:8080/api/orders/4
```

Response (`200 OK`):

```json
{
  "id": 4,
  "customer": "PT Maju Bersama",
  "status": "CREATED",
  "total": 44200000,
  "created_at": "2026-10-28T14:36:37.758001Z",
  "cancelled_at": null,
  "items": [
    { "id": 6, "order_id": 4, "sku": "SKU-LAP-001", "qty": 2, "unit_price": 18500000 },
    { "id": 7, "order_id": 4, "sku": "SKU-MON-002", "qty": 1, "unit_price": 7200000 }
  ]
}
```

### 6. Cancel Sales Order

Cancels a created order and restores inventory quantities back to products.

```bash
curl -s -X POST http://localhost:8080/api/orders/4/cancel
```

Response (`200 OK`):

```json
{
  "id": 4,
  "customer": "PT Maju Bersama",
  "status": "CANCELLED",
  "total": 44200000,
  "created_at": "2026-10-28T14:36:37.758001Z",
  "cancelled_at": "2026-10-28T15:01:53.085771Z",
  "items": [
    { "id": 6, "order_id": 4, "sku": "SKU-LAP-001", "qty": 2, "unit_price": 18500000 },
    { "id": 7, "order_id": 4, "sku": "SKU-MON-002", "qty": 1, "unit_price": 7200000 }
  ]
}
```

Cancelling an already cancelled order returns `409 Conflict`:

```json
{
  "error": {
    "code": "ORDER_ALREADY_CANCELLED"
  }
}
```

---

## Running Tests

### Backend Tests

To run the Go tests:

```bash
cd backend
go test -v ./...
```

To run with the race detector enabled:

```bash
cd backend
go test -race -v ./...
```

### Frontend Tests

To run the Vitest unit tests:

```bash
cd frontend
npm run test
```

---

## Design Decisions

1. **Transaction Integrity and Row-Level Locking**
   Stock updates and order operations use PostgreSQL transactions (`BEGIN ... COMMIT`) paired with `SELECT ... FOR UPDATE`. This guarantees atomic operations and prevents race conditions, ensuring that concurrent requests cannot oversell inventory or leave negative balances. If any item in an order fails the stock check, the entire transaction rolls back cleanly with zero records written.

2. **Server-Computed Totals and Pricing Source of Truth**
   Product prices are never trusted from client payloads. During order creation, the server looks up the latest prices directly from the products table inside the transaction lock and computes the line subtotals and grand total server-side.

3. **Reusing Existing Endpoints (GetOrderByID)**
   Rather than introducing redundant backend endpoints to query product orders, the frontend resolves order references by querying product movements (`GET /api/products/{id}/movements`), parsing the associated order IDs, and loading the full order details via the pre-existing `GET /api/orders/{id}` endpoint.

4. **React Query Cache Invalidation Strategy**
   State synchronisation relies on TanStack React Query. Any mutation (`useUpdateStock`, `useCreateOrder`, `useCancelOrder`) automatically invalidates the root `['products']` query key. This keeps the products table, the dashboard summary cards, and the product orders view in sync without manual state management.

5. **Clear Error Presentation in the UI**
   Instead of swallowing errors or dumping raw logs to the browser console, backend error codes are translated into user-facing feedback. For example, a `409 INSUFFICIENT_STOCK` error visually highlights the exact failing item row, provides an inline alert indicating the available units, and presents a notification toast.

6. **Clean Minimalist Interface**
   Built with Tailwind CSS v4, Lucide icons, and Radix UI / shadcn primitives. Technical jargon like "Server-Computed Total" and "409 Conflict" was replaced with standard terms such as "Total Amount" and "Insufficient Stock".

---

## What Could Be Improved

1. **Database Migration Tooling**
   Currently, database setup relies on raw SQL scripts mounted in Docker. In a production environment, adopting a dedicated migration tool like `golang-migrate` would allow tracking versioned migrations, schema rollbacks, and safer schema evolutions.

2. **Dedicated Query for Product Orders**
   While resolving orders through movements works reliably with the existing endpoints, adding a dedicated `GET /api/orders?sku=...` or `GET /api/products/{id}/orders` endpoint on the backend with pagination would be more efficient at scale.

3. **Authentication and Role-Based Access Control**
   Adding user authentication (e.g. JWT or session cookies) to distinguish between warehouse operators (who manage stock adjustments) and sales reps (who create customer orders).

4. **End-to-End Automated Testing**
   Adding Playwright or Cypress tests to automate user flow verification, such as creating an order, inspecting stock deduction, cancelling the order, and confirming stock restoration.

---

## Honest Hours Spent

Approximate breakdown of time spent on this project:

- Database schema, initial migrations, and seed data: ~1 hour
- Backend API endpoints, transaction locking, and error handling: ~2 hours
- Frontend layout, product catalog table, search, and status filtering: ~2 hours
- Stock adjustment modal, direction toggles, and validation: ~1.5 hours
- Create order dialog flow, item row alignment, 409 error handling: ~2 hours
- Product orders view, order cancellation modal, and stock restoration: ~1.5 hours
- Inventory summary dashboard cards and low stock attention list: ~1 hour
- Testing (backend race conditions, frontend unit tests) and documentation: ~1 hour

**Total time spent**: ~12 hours
