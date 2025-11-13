# Factory Management System - API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication Endpoints

### Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "admin",
    "role": "admin",
    "fullName": "Admin User",
    "email": "admin@factory.com",
    "token": "jwt_token_here"
  }
}
```

### Register User

**POST** `/auth/register`

Register a new user (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "receptionist",
  "fullName": "New User",
  "email": "newuser@factory.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "newuser",
    "role": "receptionist",
    "fullName": "New User",
    "token": "jwt_token_here"
  }
}
```

### Get Current User

**GET** `/auth/me`

Get currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "admin",
    "role": "admin",
    "fullName": "Admin User",
    "email": "admin@factory.com",
    "isActive": true
  }
}
```

---

## Client Endpoints

### Get All Clients

**GET** `/clients`

Retrieve all clients with optional search and pagination.

**Access:** Receptionist, Admin

**Query Parameters:**
- `search` (optional): Search by name, phone, or factory name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /clients?search=Ahmed&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "client_id",
      "name": "Ahmed Mohamed",
      "phone": "01234567890",
      "factoryName": "Ahmed Textiles",
      "address": "Cairo, Egypt",
      "notes": "Premium client",
      "createdBy": {
        "_id": "user_id",
        "username": "receptionist"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

### Get Single Client

**GET** `/clients/:id`

Retrieve a specific client by ID.

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "client_id",
    "name": "Ahmed Mohamed",
    "phone": "01234567890",
    "factoryName": "Ahmed Textiles",
    "address": "Cairo, Egypt",
    "notes": "Premium client"
  }
}
```

### Create Client

**POST** `/clients`

Create a new client.

**Access:** Receptionist, Admin

**Request Body:**
```json
{
  "name": "Sara Hassan",
  "phone": "01098765432",
  "factoryName": "Sara Fashion House",
  "address": "Alexandria, Egypt",
  "notes": "Regular orders"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_client_id",
    "name": "Sara Hassan",
    ...
  }
}
```

### Update Client

**PUT** `/clients/:id`

Update an existing client.

**Access:** Receptionist, Admin

**Request Body:**
```json
{
  "name": "Sara Hassan Updated",
  "phone": "01098765432",
  "factoryName": "Sara Fashion House",
  "address": "Alexandria, Egypt",
  "notes": "Updated notes"
}
```

### Delete Client

**DELETE** `/clients/:id`

Delete a client.

**Access:** Receptionist, Admin

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

## Order Endpoints

### Get All Orders

**GET** `/orders`

Retrieve all orders with optional filtering and pagination.

**Access:** Designer, Financial, Admin

**Query Parameters:**
- `search` (optional): Search by client name
- `state` (optional): Filter by order state (pending, active, done, delivered)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:**
```
GET /orders?state=active&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "client": {
        "_id": "client_id",
        "name": "Ahmed Mohamed",
        "phone": "01234567890"
      },
      "repeats": 100,
      "sheetSize": "A4",
      "type": "Business Cards",
      "totalPrice": 5000,
      "deposit": 2000,
      "remainingAmount": 3000,
      "orderState": "active",
      "notes": "Rush order",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 30
}
```

### Get Single Order

**GET** `/orders/:id`

Retrieve a specific order by ID.

**Access:** Designer, Financial, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "client": { ... },
    "repeats": 100,
    "sheetSize": "A4",
    "type": "Business Cards",
    "totalPrice": 5000,
    "deposit": 2000,
    "remainingAmount": 3000,
    "orderState": "active"
  }
}
```

### Create Order

**POST** `/orders`

Create a new order.

**Access:** Admin

**Request Body:**
```json
{
  "client": "client_id",
  "repeats": 100,
  "sheetSize": "A4",
  "type": "Business Cards",
  "totalPrice": 5000,
  "deposit": 2000,
  "orderState": "pending",
  "notes": "Rush order"
}
```

### Update Order

**PUT** `/orders/:id`

Update an order. Role-based field restrictions apply:
- Designer: Can update `orderState` and `notes`
- Financial: Can update `deposit`, `totalPrice`, and `notes`
- Admin: Can update all fields

**Access:** Designer, Financial, Admin

**Request Body (Designer):**
```json
{
  "orderState": "done",
  "notes": "Completed ahead of schedule"
}
```

**Request Body (Financial):**
```json
{
  "deposit": 3000,
  "notes": "Additional payment received"
}
```

### Delete Order

**DELETE** `/orders/:id`

Delete an order.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

### Get Financial Statistics

**GET** `/orders/stats/financial`

Get financial statistics and summaries.

**Access:** Financial, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalOrders": 50,
      "totalRevenue": 250000,
      "totalDeposits": 150000,
      "totalRemaining": 100000
    },
    "byState": [
      {
        "_id": "pending",
        "count": 10,
        "totalValue": 50000
      },
      {
        "_id": "active",
        "count": 20,
        "totalValue": 100000
      }
    ]
  }
}
```

---

## User Endpoints (Admin Only)

### Get All Users

**GET** `/users`

Retrieve all users.

**Access:** Admin only

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### Get Single User

**GET** `/users/:id`

Retrieve a specific user.

**Access:** Admin only

### Create User

**POST** `/users`

Create a new user.

**Access:** Admin only

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "receptionist",
  "fullName": "New User",
  "email": "newuser@factory.com"
}
```

### Update User

**PUT** `/users/:id`

Update user information (except password).

**Access:** Admin only

**Request Body:**
```json
{
  "username": "updateduser",
  "role": "designer",
  "fullName": "Updated Name",
  "isActive": true
}
```

### Delete User

**DELETE** `/users/:id`

Delete a user (cannot delete yourself).

**Access:** Admin only

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting in production.

## CORS

CORS is configured to accept requests from the frontend URL specified in the environment variables.
