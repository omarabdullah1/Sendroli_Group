# Factory Management System - Project Overview

## System Architecture

This is a full-stack MERN application designed for managing factory operations with role-based access control.

### Technology Stack

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing

**Frontend:**
- React.js 18+
- React Router for navigation
- Context API for state management
- Axios for API communication

### System Roles and Permissions

#### 1. Receptionist
- **Access:** Client Management only
- **Permissions:**
  - Create, read, update, delete clients
  - View client details

#### 2. Designer
- **Access:** Order Management (design-related)
- **Permissions:**
  - View orders
  - Update order status
  - View client information (read-only)

#### 3. Financial
- **Access:** Financial data and payment management
- **Permissions:**
  - View all orders
  - Update payment information (deposits, remaining amounts)
  - View financial summaries
  - View client information (read-only)

#### 4. Admin
- **Access:** Full system control
- **Permissions:**
  - All permissions from other roles
  - User management (create, update, delete users)
  - System configuration
  - View all data and reports

## Data Models

### User Schema
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['receptionist', 'designer', 'financial', 'admin']),
  fullName: String,
  email: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Client Schema
```javascript
{
  name: String (required),
  phone: String (required),
  factoryName: String,
  address: String,
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  client: ObjectId (ref: Client, required),
  clientSnapshot: {
    name: String,
    phone: String,
    factoryName: String
  },
  repeats: Number,
  sheetSize: String,
  type: String,
  totalPrice: Number (required),
  deposit: Number (default: 0),
  remainingAmount: Number (calculated),
  orderState: String (enum: ['pending', 'active', 'done', 'delivered']),
  notes: String,
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## API Structure

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user info

### Client Endpoints
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Order Endpoints
- `GET /api/orders` - List all orders (filtered by role)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order (admin only)
- `GET /api/orders/stats/financial` - Get financial statistics

### User Endpoints (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Security Features

1. **Authentication:** JWT tokens with expiration
2. **Authorization:** Role-based middleware for API routes
3. **Password Security:** bcrypt hashing with salt rounds
4. **Input Validation:** Express-validator for request validation
5. **CORS:** Configured for frontend origin only
6. **Environment Variables:** Sensitive data in .env files

## Frontend Features

### Common Components
- Login/Authentication forms
- Navigation bar (role-based menu items)
- Data tables with search and pagination
- Form components for CRUD operations
- Modal dialogs
- Alert/notification system

### Role-Specific Screens

**Receptionist:**
- Clients Dashboard
- Add/Edit Client Form

**Designer:**
- Orders Dashboard (design view)
- Order Details
- Update Order Status

**Financial:**
- Orders Dashboard (financial view)
- Payment Management
- Financial Reports

**Admin:**
- All above screens
- User Management Dashboard
- System Settings

## Development Workflow

1. Backend API development and testing
2. Frontend component development
3. Integration testing
4. Role-based access testing
5. Deployment preparation
