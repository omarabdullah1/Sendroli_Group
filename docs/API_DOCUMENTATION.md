### Get Revenue Timeseries

**GET** `/orders/stats/timeseries?period=30&interval=day|week|month`

Retrieve a time series of revenue aggregation.

Query parameters:
- `period` (optional): integer controlling how many intervals to return; default depends on `interval` (day=30, week=12, month=12)
- `interval` (optional): `day|week|month` — default is `day`.

Examples:
```
GET /orders/stats/timeseries?period=30&interval=day
GET /orders/stats/timeseries?period=12&interval=week
GET /orders/stats/timeseries?period=6&interval=month
```

Return format:

```json
{
  "success": true,
  "data": {
    "labels": ["2025-11-14", "2025-11-15", ...],
    "data": [1234.0, 0.0, 300.0, ...]
  }
}
```

Notes:
- `day` groups by day (YYYY-MM-DD), `week` uses ISO week-year (YYYY-W##), `month` groups by month (YYYY-MM).
- The API returns zeros for missing intervals so charts can render continuous lines.

# 📚 Sendroli Factory Management System - API Documentation

<div align="center">

![API](https://img.shields.io/badge/API-RESTful-blue)
![Auth](https://img.shields.io/badge/Auth-JWT-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

**Complete API reference for the Sendroli Factory Management System**

[🏠 Back to Main Docs](../README.md) | [🚀 Getting Started](../GETTING_STARTED.md) | [🔧 Backend Guide](../backend/README.md)

</div>

---

## 📋 Overview

This document provides comprehensive documentation for all API endpoints in the Sendroli Factory Management System. The API is built with Node.js and Express.js, featuring JWT authentication and role-based access control.

### 🔐 Authentication & Authorization

The API implements a 4-tier role system with specific permissions:
- **Admin:** Full access to all endpoints
- **Receptionist:** Client management only  
- **Designer:** Order viewing and status updates
- **Financial:** Payment management and financial reports

## 🌐 Base URL

```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

## 🔑 Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Lifecycle
- **Expiration:** 7 days (configurable)
- **Refresh:** Login again to get new token
- **Storage:** Client-side localStorage recommended for web apps

## 📊 Response Format

All API responses follow this consistent format:

### ✅ Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### ❌ Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Optional validation errors
}
```

### 📄 Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 95
    }
  }
}
```

---

## 🔐 Authentication Endpoints

### Login User

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Access:** Public

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

## 🚨 Error Codes & Status Responses

| Status Code | Description | Common Scenarios |
|-------------|-------------|------------------|
| **200** | Success | Successful GET, PUT requests |
| **201** | Created | Successful POST requests |
| **400** | Bad Request | Invalid input, validation errors |
| **401** | Unauthorized | Missing/invalid token, expired session |
| **403** | Forbidden | Insufficient role permissions |
| **404** | Not Found | Resource doesn't exist |
| **422** | Unprocessable Entity | Validation errors |
| **500** | Internal Server Error | Database errors, server issues |

### 🛡️ Security Headers

All API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 🌐 CORS Configuration

CORS is configured for:

- **Development:** `http://localhost:3000`
- **Production:** Environment-specific frontend URL
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Authorization, Content-Type

## 🔄 Rate Limiting

**Current Status:** Not implemented

**Recommended Implementation:**
```javascript
// Suggested rate limits for production
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
```

## 📝 Example API Testing

### Using cURL

```bash
# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token for authenticated request
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. **Set Base URL:** `http://localhost:5000/api`
2. **Add Authorization:** Type "Bearer Token" with your JWT
3. **Test Endpoints:** Use the documented request/response examples

## 🔗 Related Documentation

- [🏠 **Main Documentation**](../README.md) - Project overview and setup
- [🚀 **Getting Started**](../GETTING_STARTED.md) - Quick start guide
- [🔧 **Backend Guide**](../backend/README.md) - Server architecture and development
- [🎨 **Frontend Guide**](../frontend/README.md) - React app development
- [📋 **Setup Guide**](SETUP_GUIDE.md) - Detailed installation instructions

## 🤝 Contributing

When adding new API endpoints:

1. Follow the existing naming conventions
2. Implement proper role-based authorization
3. Add input validation
4. Update this documentation
5. Include proper error handling
6. Write tests for new endpoints

## 📞 Support

For API questions or issues:

- Check the [troubleshooting guide](../README.md#troubleshooting) 
- Review the [backend documentation](../backend/README.md)
- Create an issue with API request/response examples

---

<div align="center">

**Sendroli Factory Management System API Documentation**

[🔙 Back to Top](#-sendroli-factory-management-system---api-documentation) | [📚 All Docs](../README.md)

</div>
