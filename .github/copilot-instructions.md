# 🤖 GitHub Copilot Instructions for Sendroli Factory Management System

This document provides comprehensive context and coding guidelines for GitHub Copilot to assist with the Sendroli Factory Management System development.

---

## 📋 Project Context

### Project Overview
The **Sendroli Group Factory Management System** is a full-stack MERN application designed for managing factory operations with role-based access control. It provides a secure, scalable platform for managing clients, orders, and financial data across different organizational roles.

### Architecture
- **Frontend:** React.js 18+ with Vite, React Router v6, Context API, Axios
- **Backend:** Node.js with Express.js, MongoDB with Mongoose, JWT authentication
- **Database:** MongoDB with role-based data access patterns
- **Authentication:** JWT-based with bcrypt password hashing
- **Authorization:** Role-based access control (RBAC)

---

## 🏗️ System Architecture

### Role-Based System Design
The application implements a 5-tier role system:

```javascript
// User roles and their permissions
const ROLES = {
  RECEPTIONIST: {
    role: 'receptionist',
    access: ['clients'],
    permissions: {
      clients: ['create', 'read', 'update', 'delete']
    }
  },
  DESIGNER: {
    role: 'designer', 
    access: ['orders'],
    permissions: {
      orders: ['read', 'update_status'],
      clients: ['read']
    }
  },
  WORKER: {
    role: 'worker',
    access: ['orders'],
    permissions: {
      orders: ['read', 'update_status_only'],
      clients: ['read']
    }
  },
  FINANCIAL: {
    role: 'financial',
    access: ['orders', 'financial'],
    permissions: {
      orders: ['read', 'update_payments'],
      clients: ['read'],
      financial: ['read', 'reports']
    }
  },
  ADMIN: {
    role: 'admin',
    access: ['clients', 'orders', 'users', 'financial'],
    permissions: {
      clients: ['create', 'read', 'update', 'delete'],
      orders: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      financial: ['read', 'reports']
    }
  }
};
```

### Database Models

#### User Model Schema
```javascript
{
  username: String (unique, required, 3-50 chars),
  password: String (hashed with bcrypt, 6+ chars),
  role: Enum ['receptionist', 'designer', 'worker', 'financial', 'admin'],
  fullName: String (required, 2-100 chars),
  email: String (unique, required, valid format),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdBy: ObjectId (ref: User),
  timestamps: true
}
```

#### Client Model Schema
```javascript
{
  name: String (required, 2-100 chars),
  phone: String (required, valid format),
  factoryName: String (optional, max 150 chars),
  address: String (optional, max 500 chars),
  notes: String (optional, max 1000 chars),
  createdBy: ObjectId (ref: User, required),
  updatedBy: ObjectId (ref: User),
  timestamps: true
}
```

#### Order Model Schema
```javascript
{
  client: ObjectId (ref: Client, required),
  clientSnapshot: { name, phone, factoryName },
  repeats: Number (min: 1, default: 1),
  sheetSize: String (max 50 chars),
  type: String (max 100 chars),
  totalPrice: Number (required, min: 0),
  deposit: Number (default: 0, min: 0, max: totalPrice),
  remainingAmount: Number (auto-calculated),
  orderState: Enum ['pending', 'active', 'done', 'delivered'],
  notes: String (optional, max 1000 chars),
  createdBy: ObjectId (ref: User, required),
  updatedBy: ObjectId (ref: User),
  timestamps: true
}
```

---

## 🎯 Coding Guidelines

### File Structure Conventions

#### Backend Structure
```
backend/
├── config/database.js          # MongoDB connection setup
├── controllers/                # Business logic handlers
│   ├── authController.js       # Authentication logic
│   ├── clientController.js     # Client CRUD operations
│   ├── orderController.js      # Order management
│   └── userController.js       # User management (admin)
├── middleware/                 # Custom middleware
│   ├── auth.js                 # JWT auth & role authorization
│   ├── errorHandler.js         # Global error handling
│   └── validation.js           # Input validation
├── models/                     # Mongoose schemas
│   ├── User.js                 # User model with roles
│   ├── Client.js               # Client model
│   └── Order.js                # Order model with calculations
├── routes/                     # API endpoint definitions
│   ├── authRoutes.js           # Auth endpoints
│   ├── clientRoutes.js         # Client CRUD endpoints
│   ├── orderRoutes.js          # Order management endpoints
│   └── userRoutes.js           # User management endpoints
└── utils/generateToken.js      # JWT utility functions
```

#### Frontend Structure
```
frontend/src/
├── components/                 # Reusable React components
│   ├── Auth/                   # Login, Register components
│   ├── Clients/                # Client management components
│   ├── Orders/                 # Order management components
│   ├── Dashboard/              # Dashboard components
│   ├── Layout/                 # Layout wrapper components
│   ├── Navbar.js               # Navigation component
│   └── PrivateRoute.js         # Route protection
├── context/AuthContext.jsx     # Authentication state management
├── pages/                      # Page-level components
├── services/                   # API service layer
│   ├── api.js                  # Axios configuration
│   ├── authService.js          # Authentication API calls
│   ├── clientService.js        # Client API calls
│   ├── orderService.js         # Order API calls
│   └── userService.js          # User API calls
└── utils/ProtectedRoute.jsx    # Route protection utility
```

### Naming Conventions

#### Variables and Functions
```javascript
// Use camelCase for variables and functions
const userName = 'admin';
const clientData = {};
const handleSubmit = () => {};
const updateOrderStatus = async () => {};

// Use descriptive names
const isAuthenticated = true;
const hasPermission = false;
const ordersByStatus = [];
const financialStats = {};
```

#### Components (React)
```javascript
// Use PascalCase for React components
const LoginForm = () => {};
const ClientList = () => {};
const OrderDetail = () => {};
const NavigationBar = () => {};

// File naming matches component name
// LoginForm.jsx, ClientList.jsx, OrderDetail.jsx
```

#### Database Collections
```javascript
// Use PascalCase for model names
const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Order = mongoose.model('Order', orderSchema);
```

#### API Endpoints
```javascript
// Use RESTful conventions
GET    /api/clients           // Get all clients
GET    /api/clients/:id       // Get client by ID
POST   /api/clients           // Create new client
PUT    /api/clients/:id       // Update client
DELETE /api/clients/:id       // Delete client

GET    /api/orders            // Get orders (role-filtered)
POST   /api/orders            // Create order (admin only)
PUT    /api/orders/:id        // Update order (role-specific fields)
```

---

## 🔐 Authentication & Authorization Patterns

### JWT Authentication Middleware
```javascript
// Standard authentication middleware pattern
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
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
```

### Role-Based Authorization
```javascript
// Role authorization middleware pattern
const authorize = (...roles) => {
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

// Usage in routes
router.get('/clients', protect, authorize('receptionist', 'admin'), getClients);
router.get('/orders', protect, authorize('designer', 'financial', 'admin'), getOrders);
router.get('/users', protect, authorize('admin'), getUsers);
```

### Field-Level Authorization
```javascript
// Field-level access control for updates
const authorizeFieldAccess = (req, res, next) => {
  const userRole = req.user.role;
  const updateFields = Object.keys(req.body);
  
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

---

## 🎨 Frontend Patterns

### React Component Structure
```javascript
// Standard component template
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ComponentName.css';

const ComponentName = ({ prop1, prop2 }) => {
  // State hooks
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Context hooks
  const { user, token } = useAuth();
  
  // Effects
  useEffect(() => {
    // Component logic
  }, []);
  
  // Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Handle form submission
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Render
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Service Layer Pattern
```javascript
// API service template
import api from './api';

export const entityService = {
  // Get all entities
  getAll: (params = {}) => api.get('/entities', { params }),
  
  // Get entity by ID
  getById: (id) => api.get(`/entities/${id}`),
  
  // Create new entity
  create: (data) => api.post('/entities', data),
  
  // Update entity
  update: (id, data) => api.put(`/entities/${id}`, data),
  
  // Delete entity
  delete: (id) => api.delete(`/entities/${id}`),
  
  // Custom endpoints
  search: (query) => api.get(`/entities/search?q=${query}`),
  getStats: () => api.get('/entities/stats')
};
```

### Context Provider Pattern
```javascript
// Context template
import React, { createContext, useContext, useState, useEffect } from 'react';

const EntityContext = createContext();

export const EntityProvider = ({ children }) => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Context methods
  const fetchEntities = async () => {
    setLoading(true);
    try {
      const response = await entityService.getAll();
      setEntities(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    entities,
    loading,
    error,
    fetchEntities,
    // Other context methods
  };
  
  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = () => {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntity must be used within EntityProvider');
  }
  return context;
};
```

---

## 📡 API Design Patterns

### Controller Structure
```javascript
// Standard controller template
const Entity = require('../models/Entity');

// Get all entities with pagination and filtering
exports.getEntities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Add filters based on query parameters
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Role-based filtering
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    const total = await Entity.countDocuments(query);
    const entities = await Entity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName');
    
    res.status(200).json({
      success: true,
      data: {
        entities,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new entity
exports.createEntity = async (req, res, next) => {
  try {
    const entityData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const entity = await Entity.create(entityData);
    
    res.status(201).json({
      success: true,
      data: entity
    });
  } catch (error) {
    next(error);
  }
};

// Update entity
exports.updateEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if entity exists and user has permission
    const entity = await Entity.findById(id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    // Role-based access check
    if (req.user.role !== 'admin' && entity.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    const updatedEntity = await Entity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedEntity
    });
  } catch (error) {
    next(error);
  }
};
```

### Response Patterns
```javascript
// Success responses
res.status(200).json({
  success: true,
  data: result,
  message: 'Operation successful' // optional
});

// Error responses
res.status(400).json({
  success: false,
  message: 'Validation failed',
  errors: validationErrors // optional
});

// Paginated responses
res.status(200).json({
  success: true,
  data: {
    items: results,
    pagination: {
      current: page,
      pages: totalPages,
      total: totalItems
    }
  }
});
```

---

## 🎯 Business Logic Patterns

### Order Management Logic
```javascript
// Order state transitions
const ORDER_STATES = {
  PENDING: 'pending',
  ACTIVE: 'active', 
  DONE: 'done',
  DELIVERED: 'delivered'
};

const VALID_TRANSITIONS = {
  pending: ['active'],
  active: ['done'],
  done: ['delivered'],
  delivered: [] // Final state
};

// Order calculation logic
const calculateRemainingAmount = (totalPrice, deposit) => {
  return Math.max(0, totalPrice - deposit);
};

// Pre-save middleware for orders
orderSchema.pre('save', function(next) {
  // Auto-calculate remaining amount
  this.remainingAmount = calculateRemainingAmount(this.totalPrice, this.deposit);
  
  // Create client snapshot
  if (this.isNew && this.client) {
    Client.findById(this.client)
      .then(client => {
        this.clientSnapshot = {
          name: client.name,
          phone: client.phone,
          factoryName: client.factoryName
        };
        next();
      })
      .catch(next);
  } else {
    next();
  }
});
```

### Financial Calculations
```javascript
// Financial statistics aggregation
const getFinancialStats = async () => {
  const stats = await Order.aggregate([
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
  
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$orderState',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);
  
  return {
    ...stats[0],
    ordersByStatus
  };
};
```

---

## 🚨 Error Handling Patterns

### Backend Error Handling
```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Frontend Error Handling
```javascript
// API error handling with axios interceptors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject({
      message: error.response?.data?.message || 'Something went wrong',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Component error handling
const [error, setError] = useState(null);

const handleOperation = async () => {
  try {
    setError(null);
    const result = await apiCall();
    // Handle success
  } catch (err) {
    setError(err.message);
  }
};
```

---

## 🧪 Testing Patterns

### Backend Testing
```javascript
// Controller test template
describe('EntityController', () => {
  beforeEach(async () => {
    await Entity.deleteMany({});
    // Setup test data
  });
  
  describe('getEntities', () => {
    test('should return entities for authorized user', async () => {
      const token = generateTestToken({ role: 'admin' });
      
      const response = await request(app)
        .get('/api/entities')
        .set('Authorization', `Bearer ${token}`);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.entities)).toBe(true);
    });
  });
});

// Model test template
describe('Entity Model', () => {
  test('should validate required fields', async () => {
    const entity = new Entity({});
    
    let error;
    try {
      await entity.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.requiredField).toBeDefined();
  });
});
```

### Frontend Testing
```javascript
// Component test template
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';

const renderWithAuth = (component, user = mockUser) => {
  return render(
    <AuthProvider value={{ user, token: 'mock-token' }}>
      {component}
    </AuthProvider>
  );
};

describe('ComponentName', () => {
  test('renders correctly for authorized user', () => {
    renderWithAuth(<ComponentName />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  test('handles form submission', async () => {
    const mockSubmit = jest.fn();
    renderWithAuth(<ComponentName onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expectedData);
    });
  });
});
```

---

## 📊 Database Optimization

### Indexing Strategy
```javascript
// Frequently queried fields
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

clientSchema.index({ name: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ createdBy: 1 });

orderSchema.index({ client: 1 });
orderSchema.index({ orderState: 1 });
orderSchema.index({ createdAt: -1 });

// Compound indexes for common queries
orderSchema.index({ client: 1, orderState: 1 });
orderSchema.index({ orderState: 1, createdAt: -1 });
```

### Query Optimization
```javascript
// Use lean() for read-only operations
const orders = await Order.find({ orderState: 'active' })
  .lean()
  .select('client totalPrice deposit orderState')
  .populate('client', 'name phone');

// Aggregation for complex queries
const stats = await Order.aggregate([
  { $match: { orderState: { $in: ['done', 'delivered'] } } },
  {
    $group: {
      _id: '$orderState',
      count: { $sum: 1 },
      totalRevenue: { $sum: '$totalPrice' }
    }
  }
]);
```

---

## 🎯 Code Quality Standards

### ESLint Configuration
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### Code Comments Standards
```javascript
/**
 * Updates an order with role-based field restrictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Object} Updated order data
 */
const updateOrder = async (req, res, next) => {
  // Implementation
};

// Single-line comments for complex logic
// Calculate remaining amount after deposit
const remainingAmount = totalPrice - deposit;
```

---

## 🔧 Environment Configuration

### Development Environment
```env
# Development settings
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/sendroli_factory_dev

# JWT
JWT_SECRET=development_secret_key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Production Environment
```env
# Production settings
NODE_ENV=production
PORT=5000

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sendroli_factory

# JWT (Strong secret)
JWT_SECRET=production_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d

# CORS (Production domain)
CORS_ORIGIN=https://your-production-domain.com

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=error
```

---

## 📝 Common Tasks & Snippets

### Adding New Endpoints
```javascript
// 1. Add route in routes file
router.post('/entities/:id/action', protect, authorize('admin'), controller.action);

// 2. Add controller method
exports.action = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Entity.findByIdAndUpdate(id, req.body, { new: true });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 3. Add frontend service method
entityService.action = (id, data) => api.post(`/entities/${id}/action`, data);
```

### Adding Role-Based Features
```javascript
// 1. Update authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

// 2. Add role check in frontend
const { user } = useAuth();
const canAccess = user && ['admin', 'manager'].includes(user.role);

{canAccess && <ProtectedComponent />}
```

### Adding Validation
```javascript
// Backend validation
const validateInput = [
  body('field')
    .isLength({ min: 3, max: 50 })
    .withMessage('Field must be between 3 and 50 characters'),
  handleValidationErrors
];

// Frontend validation
const [errors, setErrors] = useState({});

const validateForm = (data) => {
  const newErrors = {};
  
  if (!data.field || data.field.length < 3) {
    newErrors.field = 'Field is required and must be at least 3 characters';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## 🎯 Best Practices Summary

### Security Best Practices
- Always use `protect` middleware for authenticated routes
- Implement role-based authorization for sensitive operations
- Validate and sanitize all inputs
- Use environment variables for sensitive data
- Hash passwords with bcrypt (minimum 10 rounds)
- Implement rate limiting for API endpoints
- Use HTTPS in production

### Performance Best Practices
- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Use `lean()` for read-only MongoDB operations
- Cache frequently accessed data
- Optimize database queries with aggregation
- Use connection pooling for database connections

### Code Organization Best Practices
- Follow the established folder structure
- Use consistent naming conventions
- Implement proper error handling
- Write comprehensive tests
- Document complex business logic
- Use TypeScript for better type safety (optional)
- Follow the single responsibility principle

### Development Workflow Best Practices
- Use feature branches for new development
- Write tests before implementing features (TDD)
- Run linters and formatters before committing
- Use conventional commit messages
- Review code before merging
- Keep dependencies updated and secure

---

## 📚 Additional Resources

### Project Documentation
- [Main README](../README.md) - Project overview and setup
- [Frontend README](../frontend/README.md) - Frontend-specific documentation
- [Backend README](../backend/README.md) - Backend-specific documentation
- [API Documentation](../docs/API_DOCUMENTATION.md) - Complete API reference

### External Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🤖 Copilot Usage Tips

When working with this codebase, GitHub Copilot should:

1. **Follow Role-Based Patterns:** Always consider user roles when suggesting authentication and authorization code
2. **Maintain Consistency:** Use the established patterns for controllers, services, and components
3. **Include Error Handling:** Always include proper error handling in suggestions
4. **Follow Naming Conventions:** Use the established naming patterns for files, functions, and variables
5. **Consider Security:** Include security best practices in all suggestions
6. **Use Proper Validation:** Include input validation for all user inputs
7. **Follow API Patterns:** Use the established RESTful API patterns and response structures
8. **Include Documentation:** Suggest appropriate comments and documentation for complex logic

---

This document serves as a comprehensive reference for GitHub Copilot to understand the project structure, patterns, and best practices for the Sendroli Factory Management System.