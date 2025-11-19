# ⚡ Sendroli Factory Management - Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-16+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-blue?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green?logo=mongodb)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

**Robust Node.js backend API for the Sendroli Factory Management System**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The backend is a RESTful API built with Node.js and Express.js that provides secure, scalable endpoints for managing factory operations. It features JWT-based authentication, role-based access control, and comprehensive data validation.

### 🎯 Key Features

- **🔐 JWT Authentication:** Secure token-based authentication
- **👥 Role-Based Access Control:** Granular permissions for different user types
- **📊 RESTful API:** Clean, consistent API design
- **🛡️ Input Validation:** Comprehensive request validation
- **🗄️ MongoDB Integration:** Efficient data storage with Mongoose
- **⚡ Performance Optimized:** Efficient database queries and caching
- **🔍 Error Handling:** Comprehensive error management
- **📝 Logging:** Detailed application logging

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime environment |
| **Express.js** | 4.18 | Web application framework |
| **MongoDB** | 4.4+ | NoSQL database |
| **Mongoose** | 7.5 | MongoDB object modeling |
| **jsonwebtoken** | 9.0 | JWT token generation and verification |
| **bcryptjs** | 2.4 | Password hashing |
| **express-validator** | 7.0 | Input validation middleware |
| **cors** | 2.8 | Cross-origin resource sharing |
| **dotenv** | 16.3 | Environment variable management |
| **nodemon** | 3.0 | Development server with auto-reload |

## 📁 Project Structure

```
backend/
├── 📁 config/                    # Configuration files
│   └── database.js              # Database connection setup
│
├── 📁 controllers/              # Route controllers (business logic)
│   ├── authController.js        # Authentication logic
│   ├── clientController.js      # Client management logic
│   ├── orderController.js       # Order management logic
│   └── userController.js        # User management logic
│
├── 📁 middleware/               # Custom middleware functions
│   ├── auth.js                  # JWT authentication middleware
│   ├── errorHandler.js          # Global error handling
│   └── validation.js            # Input validation middleware
│
├── 📁 models/                   # Database schemas and models
│   ├── User.js                  # User model with roles
│   ├── Client.js                # Client model
│   └── Order.js                 # Order model
│
├── 📁 routes/                   # API endpoint definitions
│   ├── authRoutes.js            # Authentication routes
│   ├── clientRoutes.js          # Client CRUD routes
│   ├── orderRoutes.js           # Order CRUD routes
│   └── userRoutes.js            # User management routes
│
├── 📁 scripts/                  # Utility and maintenance scripts
│   └── seedData.js              # Database seeding script
│
├── 📁 utils/                    # Helper functions
│   └── generateToken.js         # JWT token generation utility
│
├── 📁 __tests__/                # Test files
│   ├── auth.test.js             # Authentication tests
│   ├── client.test.js           # Client management tests
│   └── order.test.js            # Order management tests
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore patterns
├── Dockerfile                   # Docker containerization
├── package.json                 # Dependencies and scripts
├── server.js                    # Application entry point
└── README.md                    # This comprehensive guide
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **npm** or **yarn** - Package manager

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/sendroli_factory
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
   JWT_EXPIRE=7d
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   
   # Logging
   LOG_LEVEL=info
   ```

5. **Start MongoDB service:**
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

8. **Verify installation:**
   ```bash
   curl http://localhost:5000/api/health
   ```

**Server will run on:** `http://localhost:5000`

## ⚙️ Environment Setup

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sendroli_factory
MONGODB_TEST_URI=mongodb://localhost:27017/sendroli_factory_test

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=10

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (if needed)
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
```

### Development vs Production

#### Development Environment
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sendroli_factory_dev
JWT_SECRET=dev_secret_key_for_development_only
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

#### Production Environment
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sendroli_factory
JWT_SECRET=super_secure_production_jwt_secret_minimum_32_characters
CORS_ORIGIN=https://your-production-domain.com
LOG_LEVEL=error
```

### Database Setup

#### Local MongoDB Setup

1. **Install MongoDB:**
   ```bash
   # macOS with Homebrew
   brew install mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB service:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify connection:**
   ```bash
   mongo
   # or with newer versions
   mongosh
   ```

#### MongoDB Atlas (Cloud) Setup

1. **Create MongoDB Atlas account**
2. **Create a cluster**
3. **Configure network access (IP whitelist)**
4. **Create database user**
5. **Get connection string**
6. **Update MONGODB_URI in .env**

## 🗄️ Database Models

### User Model (`models/User.js`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username must be less than 50 characters']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: ['receptionist', 'designer', 'financial', 'admin'],
    required: [true, 'Role is required'],
    default: 'receptionist'
  },
  
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name must be less than 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(process.env.BCRYPT_SALT_ROUNDS || 10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### Client Model (`models/Client.js`)

```javascript
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name must be less than 100 characters']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  
  factoryName: {
    type: String,
    trim: true,
    maxlength: [150, 'Factory name must be less than 150 characters']
  },
  
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address must be less than 500 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must be less than 1000 characters']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
clientSchema.index({ name: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ createdBy: 1 });

// Virtual for order count
clientSchema.virtual('orderCount', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'client',
  count: true
});

module.exports = mongoose.model('Client', clientSchema);
```

### Order Model (`models/Order.js`)

```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  
  // Snapshot of client data at order creation time
  clientSnapshot: {
    name: String,
    phone: String,
    factoryName: String
  },
  
  repeats: {
    type: Number,
    min: [1, 'Repeats must be at least 1'],
    default: 1
  },
  
  sheetSize: {
    type: String,
    trim: true,
    maxlength: [50, 'Sheet size must be less than 50 characters']
  },
  
  type: {
    type: String,
    trim: true,
    maxlength: [100, 'Type must be less than 100 characters']
  },
  
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  
  deposit: {
    type: Number,
    default: 0,
    min: [0, 'Deposit cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalPrice;
      },
      message: 'Deposit cannot exceed total price'
    }
  },
  
  remainingAmount: {
    type: Number,
    default: function() {
      return this.totalPrice - this.deposit;
    }
  },
  
  orderState: {
    type: String,
    enum: ['pending', 'active', 'done', 'delivered'],
    default: 'pending'
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must be less than 1000 characters']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ client: 1 });
orderSchema.index({ orderState: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate remaining amount
orderSchema.pre('save', function(next) {
  this.remainingAmount = this.totalPrice - this.deposit;
  next();
});

// Static methods for analytics
orderSchema.statics.getFinancialStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        totalDeposits: { $sum: '$deposit' },
        remainingPayments: { $sum: '$remainingAmount' },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);
};

orderSchema.statics.getOrdersByStatus = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$orderState',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
```

## 🔌 API Endpoints

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

### Authentication Endpoints

#### POST `/api/auth/login`
**Purpose:** User authentication

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a7b2c3d1e2f3a4b5c6d7e8",
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@sendroli.com",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### POST `/api/auth/register`
**Purpose:** Create new user (Admin only)
**Authorization:** Bearer token required
**Role:** Admin only

**Request:**
```json
{
  "username": "newemployee",
  "password": "secure123",
  "role": "receptionist",
  "fullName": "John Doe",
  "email": "john.doe@sendroli.com"
}
```

#### GET `/api/auth/me`
**Purpose:** Get current user information
**Authorization:** Bearer token required

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64a7b2c3d1e2f3a4b5c6d7e8",
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@sendroli.com"
  }
}
```

### Client Management Endpoints

#### GET `/api/clients`
**Purpose:** Get all clients
**Authorization:** Bearer token required
**Role:** Receptionist, Admin
**Query Parameters:**
- `search`: Search by name or phone
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "64a7b2c3d1e2f3a4b5c6d7e8",
        "name": "ABC Manufacturing",
        "phone": "+1234567890",
        "factoryName": "ABC Factory",
        "address": "123 Industrial St, City, State",
        "notes": "Important client",
        "orderCount": 5,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25
    }
  }
}
```

#### GET `/api/clients/:id`
**Purpose:** Get client by ID
**Authorization:** Bearer token required
**Role:** Receptionist, Admin

#### POST `/api/clients`
**Purpose:** Create new client
**Authorization:** Bearer token required
**Role:** Receptionist, Admin

**Request:**
```json
{
  "name": "New Company Ltd",
  "phone": "+1987654321",
  "factoryName": "New Factory",
  "address": "456 Business Ave, City, State",
  "notes": "New client from referral"
}
```

#### PUT `/api/clients/:id`
**Purpose:** Update client
**Authorization:** Bearer token required
**Role:** Receptionist, Admin

#### DELETE `/api/clients/:id`
**Purpose:** Delete client
**Authorization:** Bearer token required
**Role:** Admin only

### Order Management Endpoints

#### GET `/api/orders`
**Purpose:** Get orders (filtered by role)
**Authorization:** Bearer token required
**Role:** Designer, Financial, Admin
**Query Parameters:**
- `status`: Filter by order status
- `client`: Filter by client ID
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "64a7b2c3d1e2f3a4b5c6d7e9",
        "client": {
          "id": "64a7b2c3d1e2f3a4b5c6d7e8",
          "name": "ABC Manufacturing"
        },
        "repeats": 1000,
        "sheetSize": "A4",
        "type": "Business Cards",
        "totalPrice": 500,
        "deposit": 150,
        "remainingAmount": 350,
        "orderState": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 15
    }
  }
}
```

#### GET `/api/orders/:id`
**Purpose:** Get order by ID
**Authorization:** Bearer token required
**Role:** Designer, Financial, Admin

#### POST `/api/orders`
**Purpose:** Create new order
**Authorization:** Bearer token required
**Role:** Admin

**Request:**
```json
{
  "client": "64a7b2c3d1e2f3a4b5c6d7e8",
  "repeats": 1000,
  "sheetSize": "A4",
  "type": "Business Cards",
  "totalPrice": 500,
  "deposit": 150,
  "notes": "Rush order - needed by Friday"
}
```

#### PUT `/api/orders/:id`
**Purpose:** Update order (role-specific fields)
**Authorization:** Bearer token required
**Role:** Designer (status only), Financial (payments only), Admin (all fields)

**Designer Request (Status Update):**
```json
{
  "orderState": "done"
}
```

**Financial Request (Payment Update):**
```json
{
  "deposit": 200
}
```

#### DELETE `/api/orders/:id`
**Purpose:** Delete order
**Authorization:** Bearer token required
**Role:** Admin only

#### GET `/api/orders/stats/financial`
**Purpose:** Get financial statistics
**Authorization:** Bearer token required
**Role:** Financial, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 75000,
    "totalDeposits": 25000,
    "remainingPayments": 50000,
    "averageOrderValue": 500,
    "ordersByStatus": [
      {
        "status": "pending",
        "count": 20,
        "totalValue": 10000
      },
      {
        "status": "active",
        "count": 50,
        "totalValue": 25000
      }
    ]
  }
}
```

### User Management Endpoints (Admin Only)

#### GET `/api/users`
**Purpose:** Get all users
**Authorization:** Bearer token required
**Role:** Admin only

#### GET `/api/users/:id`
**Purpose:** Get user by ID
**Authorization:** Bearer token required
**Role:** Admin only

#### POST `/api/users`
**Purpose:** Create new user
**Authorization:** Bearer token required
**Role:** Admin only

#### PUT `/api/users/:id`
**Purpose:** Update user
**Authorization:** Bearer token required
**Role:** Admin only

#### DELETE `/api/users/:id`
**Purpose:** Delete user
**Authorization:** Bearer token required
**Role:** Admin only

## 🔐 Authentication

### JWT Implementation

#### Token Generation (`utils/generateToken.js`)
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'sendroli-factory',
    audience: 'sendroli-app'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
```

#### Authentication Controller (`controllers/authController.js`)
```javascript
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id,
      username: user.username,
      role: user.role
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, password, role, fullName, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      password,
      role,
      fullName,
      email,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## 👥 Authorization

### Role-Based Access Control

#### Authorization Middleware (`middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    next();
  };
};

// Role-based resource access
exports.authorizeResourceAccess = (resourceType) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    switch (resourceType) {
      case 'clients':
        if (!['receptionist', 'admin'].includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Only receptionists and admins can manage clients'
          });
        }
        break;

      case 'orders':
        if (!['designer', 'financial', 'admin'].includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Only designers, financial staff, and admins can access orders'
          });
        }
        break;

      case 'users':
        if (userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Only admins can manage users'
          });
        }
        break;

      default:
        break;
    }

    next();
  };
};

// Field-level authorization for updates
exports.authorizeFieldAccess = (req, res, next) => {
  const userRole = req.user.role;
  const updateFields = Object.keys(req.body);

  // Designer can only update order status
  if (userRole === 'designer') {
    const allowedFields = ['orderState', 'notes'];
    const hasUnauthorizedFields = updateFields.some(field => !allowedFields.includes(field));
    
    if (hasUnauthorizedFields) {
      return res.status(403).json({
        success: false,
        message: 'Designers can only update order status and notes'
      });
    }
  }

  // Financial can only update payment-related fields
  if (userRole === 'financial') {
    const allowedFields = ['deposit', 'totalPrice', 'notes'];
    const hasUnauthorizedFields = updateFields.some(field => !allowedFields.includes(field));
    
    if (hasUnauthorizedFields) {
      return res.status(403).json({
        success: false,
        message: 'Financial staff can only update payment-related fields'
      });
    }
  }

  next();
};
```

### Route Protection Examples

#### Protected Routes (`routes/orderRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { protect, authorize, authorizeResourceAccess, authorizeFieldAccess } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// All routes require authentication
router.use(protect);

// All routes require order access
router.use(authorizeResourceAccess('orders'));

// Get all orders (Designer, Financial, Admin)
router.get('/', orderController.getAllOrders);

// Get single order (Designer, Financial, Admin)
router.get('/:id', orderController.getOrder);

// Create order (Admin only)
router.post('/', authorize('admin'), orderController.createOrder);

// Update order (Role-based field restrictions)
router.put('/:id', authorizeFieldAccess, orderController.updateOrder);

// Delete order (Admin only)
router.delete('/:id', authorize('admin'), orderController.deleteOrder);

// Financial statistics (Financial, Admin)
router.get('/stats/financial', authorize('financial', 'admin'), orderController.getFinancialStats);

module.exports = router;
```

## 🛡️ Middleware

### Input Validation (`middleware/validation.js`)

```javascript
const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
};

// User validation rules
exports.validateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('role')
    .isIn(['receptionist', 'designer', 'financial', 'admin'])
    .withMessage('Invalid role specified'),
    
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
];

// Client validation rules
exports.validateClient = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters')
    .trim(),
    
  body('phone')
    .matches(/^[\+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 8, max: 20 })
    .withMessage('Phone number must be between 8 and 20 characters'),
    
  body('factoryName')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Factory name must be less than 150 characters')
    .trim(),
    
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
    .trim(),
    
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
    .trim()
];

// Order validation rules
exports.validateOrder = [
  body('client')
    .isMongoId()
    .withMessage('Valid client ID is required'),
    
  body('repeats')
    .isInt({ min: 1 })
    .withMessage('Repeats must be a positive integer'),
    
  body('sheetSize')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Sheet size must be less than 50 characters')
    .trim(),
    
  body('type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Type must be less than 100 characters')
    .trim(),
    
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
    
  body('deposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number'),
    
  body('orderState')
    .optional()
    .isIn(['pending', 'active', 'done', 'delivered'])
    .withMessage('Invalid order state'),
    
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
    .trim()
];

// ID parameter validation
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Query parameter validation
exports.validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim()
];
```

### Error Handling (`middleware/errorHandler.js`)

```javascript
// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### Request Logging Middleware

```javascript
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = requestLogger;
```

## 🚀 Performance

### Database Optimization

#### Indexing Strategy
```javascript
// User model indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Client model indexes
clientSchema.index({ name: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ createdBy: 1 });

// Order model indexes
orderSchema.index({ client: 1 });
orderSchema.index({ orderState: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ createdBy: 1 });

// Compound indexes for common queries
orderSchema.index({ client: 1, orderState: 1 });
orderSchema.index({ orderState: 1, createdAt: -1 });
```

#### Query Optimization
```javascript
// Efficient pagination
const getOrders = async (page, limit) => {
  const skip = (page - 1) * limit;
  
  return await Order.find()
    .populate('client', 'name phone factoryName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for read-only operations
};

// Aggregation for statistics
const getFinancialStats = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        totalDeposits: { $sum: '$deposit' },
        remainingPayments: { $sum: '$remainingAmount' }
      }
    }
  ]);
};
```

### Caching Strategy

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};

// Usage
router.get('/stats/financial', cacheMiddleware(300), getFinancialStats);
```

## 🧪 Testing

### Test Structure

```
backend/
├── __tests__/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── client.test.js
│   │   └── order.test.js
│   ├── unit/
│   │   ├── models/
│   │   │   ├── User.test.js
│   │   │   ├── Client.test.js
│   │   │   └── Order.test.js
│   │   └── utils/
│   │       └── generateToken.test.js
│   └── fixtures/
│       ├── users.js
│       ├── clients.js
│       └── orders.js
└── jest.config.js
```

### Test Examples

#### Authentication Tests (`__tests__/integration/auth.test.js`)
```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');

describe('Authentication', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    
    // Create test user
    await User.create({
      username: 'testuser',
      password: 'password123',
      role: 'admin',
      fullName: 'Test User',
      email: 'test@example.com'
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return user info with valid token', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Get user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('testuser');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Model Tests (`__tests__/unit/models/User.test.js`)
```javascript
const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model', () => {
  test('should hash password before saving', async () => {
    const userData = {
      username: 'testuser',
      password: 'plainpassword',
      role: 'admin',
      fullName: 'Test User',
      email: 'test@example.com'
    };

    const user = new User(userData);
    await user.save();

    expect(user.password).not.toBe('plainpassword');
    expect(user.password.length).toBeGreaterThan(10);
  });

  test('should validate required fields', async () => {
    const user = new User({});

    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.username).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  test('should compare passwords correctly', async () => {
    const user = new User({
      username: 'testuser',
      password: 'password123',
      role: 'admin',
      fullName: 'Test User',
      email: 'test@example.com'
    });

    await user.save();

    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.js

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Test Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🚀 Deployment

### Production Environment Setup

#### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sendroli_factory

# JWT
JWT_SECRET=super_secure_production_jwt_secret_minimum_32_characters_long
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://your-production-domain.com

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=error
```

### Docker Deployment

#### Dockerfile
```dockerfile
# Use Node.js LTS version
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of app directory
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=sendroli_factory
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Cloud Deployment

#### Heroku Deployment
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create Heroku app
heroku create sendroli-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_production_secret
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=mongodb+srv://...
railway variables set JWT_SECRET=your_production_secret

# Deploy
railway up
```

### Production Security Checklist

- [ ] **Environment Variables:** All secrets in environment variables
- [ ] **HTTPS:** SSL/TLS encryption enabled
- [ ] **CORS:** Configured for production domain only
- [ ] **Rate Limiting:** Implemented to prevent abuse
- [ ] **Input Validation:** All inputs validated and sanitized
- [ ] **Error Handling:** No sensitive information in error messages
- [ ] **Logging:** Comprehensive logging without sensitive data
- [ ] **Database:** Connection secured with authentication
- [ ] **Dependencies:** All packages updated and audited
- [ ] **Monitoring:** Application monitoring and alerting setup

## 🔍 Monitoring

### Health Check Endpoint

```javascript
// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});
```

### Application Metrics

```javascript
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0
  },
  response_times: [],
  memory_usage: process.memoryUsage(),
  uptime: process.uptime()
};

// Metrics middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  metrics.requests.total++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.response_times.push(duration);
    
    if (res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.error++;
    }
    
    // Keep only last 1000 response times
    if (metrics.response_times.length > 1000) {
      metrics.response_times = metrics.response_times.slice(-1000);
    }
  });
  
  next();
};

// Metrics endpoint
router.get('/metrics', (req, res) => {
  const avgResponseTime = metrics.response_times.length > 0
    ? metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length
    : 0;

  res.json({
    ...metrics,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
    average_response_time: Math.round(avgResponseTime * 100) / 100
  });
});
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB service status
# macOS
brew services list | grep mongodb

# Ubuntu/Debian
sudo systemctl status mongod

# Check connection string
node -e "console.log(process.env.MONGODB_URI)"

# Test connection
mongosh "your-connection-string"
```

#### JWT Token Issues
```javascript
// Debug JWT token
const jwt = require('jsonwebtoken');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token error:', error.message);
}

// Check token expiration
const payload = jwt.decode(token);
console.log('Token expires:', new Date(payload.exp * 1000));
```

#### Memory Leaks
```javascript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100
  });
}, 30000);
```

#### Performance Issues
```javascript
// Add request timing
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 1000) { // Log slow requests
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  
  next();
});

// Monitor database query performance
mongoose.set('debug', true);
```

### Debug Mode

```javascript
// Add to server.js for development
if (process.env.NODE_ENV === 'development') {
  // Enable Mongoose debugging
  mongoose.set('debug', true);
  
  // Log all requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    next();
  });
}
```

---

## 📞 Support

### Getting Help

1. **Check Documentation:** Review this comprehensive guide
2. **Frontend Issues:** Check the [frontend README](../frontend/README.md)
3. **Main Documentation:** See the [main README](../README.md)
4. **GitHub Issues:** Open an issue for bugs or feature requests

### Useful Resources

- **Node.js Documentation:** [nodejs.org](https://nodejs.org/docs/)
- **Express.js Documentation:** [expressjs.com](https://expressjs.com/)
- **MongoDB Documentation:** [docs.mongodb.com](https://docs.mongodb.com/)
- **Mongoose Documentation:** [mongoosejs.com](https://mongoosejs.com/)
- **JWT Documentation:** [jwt.io](https://jwt.io/)

---

<div align="center">

**⚡ Robust Node.js Backend for Sendroli Factory Management**

*Built with Node.js, Express.js, MongoDB, and modern backend technologies*

[📋 Back to Main README](../README.md)

</div>