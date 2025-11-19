# 🏭 Sendroli Group Factory Management System

<div align="center">

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive MERN stack application for managing factory operations with role-based access control.

[🚀 Quick Start](#quick-start) •
[📖 Documentation](#documentation) •
[🏗️ Architecture](#architecture) •
[� Security](#security) •
[📚 API Reference](#api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Roles](#system-roles)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

---

## 🎯 Overview

The Sendroli Group Factory Management System is a full-stack web application designed to streamline factory operations through role-based access control. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js), it provides a secure, scalable, and user-friendly platform for managing clients, orders, and financial data across different organizational roles.

### 🎯 Project Goals

- **Centralized Management:** Unified platform for all factory operations
- **Role-Based Security:** Granular access control for different user types
- **Real-Time Updates:** Live data synchronization across the platform
- **Scalable Architecture:** Modular design for easy feature expansion
- **Production Ready:** Comprehensive security and error handling

## �🚀 Features

### 🔐 **Multi-Role Access Control**

- **Receptionist:** Client management only
- **Designer:** Order viewing and status updates
- **Worker:** Order viewing and state updates (implements designs)
- **Financial:** Payment management and financial reports
- **Admin:** Full system control and user management

### 👥 **Client Management**

- Complete CRUD operations for client records
- Advanced search and filtering capabilities
- Client contact information and factory details
- Notes and communication tracking

### 📋 **Order Management**

- Comprehensive order tracking with status updates
- Link orders to existing clients or create new ones
- Detailed order specifications (repeats, size, type, pricing)
- Payment tracking (deposits, remaining balances)
- Order state management (pending → active → done → delivered)

### 💰 **Financial Tracking**

- Real-time payment monitoring
- Automatic remaining balance calculations
- Financial summaries and reports
- Deposit and payment history

### 🔒 **Security Features**

- JWT-based authentication with token expiration
- Role-based middleware for API protection
- Secure password hashing with bcrypt
- Protected routes and CORS configuration

### 📱 **User Experience**

- Responsive design for desktop and mobile
- Intuitive navigation with role-based menus
- Real-time form validation
- Loading states and error handling
- Clean, modern interface

## 📋 System Roles

### 👤 Receptionist

**Focus:** Client Relationship Management

- ✅ Create, view, update, delete clients
- ✅ Manage client contact information
- ✅ Add client notes and communications
- ❌ Cannot access orders or financial data
- ❌ Cannot manage system users

### 🎨 Designer

**Focus:** Order Management and Design Workflow

- ✅ View all orders and their details
- ✅ Update order status (pending → active → done → delivered)
- ✅ View client information (read-only)
- ✅ Track order progress and specifications
- ❌ Cannot edit pricing or payment information
- ❌ Cannot manage clients or users

### � Worker

**Focus:** Order Implementation and Machine Operation

- ✅ View all orders and their details
- ✅ Update order status only (pending → active → done → delivered)
- ✅ View client information (read-only)
- ✅ Track order progress
- ❌ Cannot edit pricing or payment information
- ❌ Cannot manage clients or users
- ❌ Cannot add notes or modify other order details

### �💰 Financial

**Focus:** Payment and Financial Management

- ✅ View all orders with financial details
- ✅ Update payment amounts (deposits, remainings)
- ✅ Access financial statistics and reports
- ✅ View client information (read-only)
- ✅ Track payment history
- ❌ Cannot change order status
- ❌ Cannot manage clients or users

### 👑 Admin

**Focus:** System Administration and Full Control

- ✅ Complete access to all features
- ✅ User management (create, edit, delete, activate/deactivate)
- ✅ Full client and order management
- ✅ System configuration and settings
- ✅ Access to all reports and analytics
- ✅ Database seeding and maintenance

## 🏗️ Architecture

### System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React.js)    │◄───┤  (Express.js)   │◄───┤   (MongoDB)     │
│                 │    │                 │    │                 │
│ • Components    │    │ • RESTful API   │    │ • Users         │
│ • Pages         │    │ • Middleware    │    │ • Clients       │
│ • Services      │    │ • Controllers   │    │ • Orders        │
│ • Context API   │    │ • Models        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture

```
User Request → React Router → Auth Check → API Call → 
Middleware Validation → Controller Logic → Database Query → 
Response Processing → UI Update
```

### Security Architecture

```
JWT Token ──┐
            ├──► Middleware Verification ──► Role-Based Access Control
CORS Setup ──┘
            ├──► Protected Routes ──────────► Authorized Resources
Password Hash ──┘
```

## �️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v14+ | JavaScript runtime environment |
| **Express.js** | v4.18 | Web application framework |
| **MongoDB** | v4.4+ | NoSQL database |
| **Mongoose** | v7.5 | MongoDB object modeling |
| **JWT** | v9.0 | Authentication tokens |
| **bcryptjs** | v2.4 | Password hashing |
| **CORS** | v2.8 | Cross-origin resource sharing |
| **dotenv** | v16.3 | Environment variable management |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React.js** | v18.2 | User interface library |
| **Vite** | v7.2+ | Modern build tool and dev server |
| **React Router** | v6.15 | Client-side routing |
| **Axios** | v1.5 | HTTP client for API calls |
| **Context API** | Built-in | State management |
| **Modern CSS** | - | Component styling |

### Development Tools

| Tool | Purpose |
|------|---------|
| **nodemon** | Backend development server with auto-reload |
| **Vite** | Frontend build and development tools (replaced react-scripts for security) |
| **ESLint** | Code linting and quality assurance |
| **Git** | Version control system |

## 📁 Project Structure

```
Sendroli_Group/
├── 📁 backend/                 # Node.js Backend Application
│   ├── 📁 config/             # Configuration files
│   │   └── database.js        # Database connection setup
│   ├── 📁 controllers/        # Business logic handlers
│   │   ├── authController.js  # Authentication logic
│   │   ├── clientController.js# Client management logic
│   │   ├── orderController.js # Order management logic
│   │   └── userController.js  # User management logic
│   ├── 📁 middleware/         # Custom middleware functions
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── errorHandler.js   # Global error handling
│   ├── 📁 models/            # Database schemas and models
│   │   ├── User.js           # User model with roles
│   │   ├── Client.js         # Client model
│   │   └── Order.js          # Order model
│   ├── 📁 routes/            # API endpoint definitions
│   │   ├── authRoutes.js     # Authentication routes
│   │   ├── clientRoutes.js   # Client CRUD routes
│   │   ├── orderRoutes.js    # Order CRUD routes
│   │   └── userRoutes.js     # User management routes
│   ├── 📁 scripts/           # Utility and maintenance scripts
│   │   └── seedData.js       # Database seeding script
│   ├── 📁 utils/             # Helper functions
│   │   └── generateToken.js  # JWT token generation
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend dependencies and scripts
│   ├── server.js             # Application entry point
│   └── Dockerfile            # Docker containerization
│
├── 📁 frontend/               # React Frontend Application
│   ├── 📁 public/            # Static public assets
│   │   ├── index.html        # Main HTML template
│   │   └── vite.svg          # Application favicon
│   ├── 📁 src/               # Source code
│   │   ├── 📁 components/    # Reusable React components
│   │   │   ├── 📁 Auth/      # Authentication components
│   │   │   │   ├── Login.jsx # Login form component
│   │   │   │   └── Register.jsx # Registration form
│   │   │   ├── 📁 Clients/   # Client management components
│   │   │   │   ├── ClientList.jsx    # Client listing
│   │   │   │   ├── ClientForm.jsx    # Client form
│   │   │   │   └── ClientDetail.jsx  # Client details
│   │   │   ├── 📁 Orders/    # Order management components
│   │   │   │   ├── OrderList.jsx     # Order listing
│   │   │   │   ├── OrderForm.jsx     # Order form
│   │   │   │   └── OrderDetail.jsx   # Order details
│   │   │   ├── 📁 Dashboard/ # Dashboard components
│   │   │   │   └── Dashboard.jsx     # Main dashboard
│   │   │   ├── 📁 Layout/    # Layout components
│   │   │   │   └── Layout.jsx        # Main layout wrapper
│   │   │   ├── Navbar.js     # Navigation component
│   │   │   └── PrivateRoute.js # Protected route wrapper
│   │   ├── 📁 context/       # React Context providers
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── 📁 pages/         # Page-level components
│   │   │   ├── Home.js       # Homepage
│   │   │   ├── Clients.js    # Clients page
│   │   │   ├── Orders.js     # Orders page
│   │   │   ├── FinancialStats.js # Financial dashboard
│   │   │   ├── Users.js      # User management page
│   │   │   └── Unauthorized.js # Access denied page
│   │   ├── 📁 services/      # API service functions
│   │   │   ├── api.js        # Axios configuration
│   │   │   ├── authService.js # Auth API calls
│   │   │   ├── clientService.js # Client API calls
│   │   │   ├── orderService.js  # Order API calls
│   │   │   └── userService.js   # User API calls
│   │   ├── 📁 utils/         # Utility functions
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Application entry point
│   │   ├── App.css           # Global application styles
│   │   └── index.css         # Base CSS styles
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.js        # Vite build configuration
│   └── Dockerfile            # Docker containerization
│
├── 📁 docs/                  # Documentation files
│   ├── API_DOCUMENTATION.md  # Complete API reference
│   └── SETUP_GUIDE.md       # Detailed setup instructions
│
├── 📁 .github/              # GitHub specific files
│   └── copilot-instructions.md # GitHub Copilot context
│
├── 🐳 docker-compose.yml     # Docker composition for deployment
├── 🐳 docker-compose.dev.yml # Docker composition for development
├── 📋 README.md              # This comprehensive guide
├── 📋 PROJECT_OVERVIEW.md    # Detailed project architecture
├── 📋 IMPLEMENTATION_SUMMARY.md # Implementation status
├── 📋 GETTING_STARTED.md     # Quick start guide
├── 📋 FOLDER_STRUCTURE.md    # Project organization guide
├── 📋 USAGE_GUIDE.md         # User manual
├── 📋 SECURITY.md            # Security implementation details
└── 🐳 DOCKER_GUIDE.md        # Docker setup and deployment
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **npm** or **yarn** - Package manager
- **Git** - Version control system

### Backend Setup

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

4. **Configure your `.env` file:**

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sendroli_factory
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

5. **Seed the database (optional):**

   ```bash
   npm run seed
   ```

6. **Start the backend server:**

   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

**Backend will run on:** `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file:**

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_APP_NAME=Sendroli Factory Management
   ```

5. **Start the frontend:**

   ```bash
   npm start
   ```

**Frontend will run on:** `http://localhost:3000`

## 🔐 Default Users (After Seeding)

After running the seed script, you can login with these default accounts:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | Admin | Full system access |
| receptionist | recep123 | Receptionist | Client management only |
| designer | design123 | Designer | Order viewing and status updates |
| worker | worker123 | Worker | Order viewing and state updates only |
| financial | finance123 | Financial | Payment management and reports |

**⚠️ IMPORTANT:** Change these passwords immediately in production!

## 📚 API Documentation

### Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a7b2c3d1e2f3a4b5c6d7e8",
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@sendroli.com"
  }
}
```

#### Register User (Admin Only)

```http
POST /api/auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "receptionist",
  "fullName": "New User",
  "email": "newuser@sendroli.com"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Client Management Endpoints

#### Get All Clients

```http
GET /api/clients
Authorization: Bearer <token>
```

#### Get Client by ID

```http
GET /api/clients/:id
Authorization: Bearer <token>
```

#### Create New Client

```http
POST /api/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "ABC Manufacturing",
  "phone": "+1234567890",
  "factoryName": "ABC Factory",
  "address": "123 Industrial St, City, State",
  "notes": "Important client - handle with priority"
}
```

#### Update Client

```http
PUT /api/clients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "phone": "+0987654321"
}
```

#### Delete Client

```http
DELETE /api/clients/:id
Authorization: Bearer <token>
```

### Order Management Endpoints

#### Get All Orders

```http
GET /api/orders
Authorization: Bearer <token>
```

#### Create New Order

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

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

#### Update Order

```http
PUT /api/orders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderState": "active",
  "deposit": 200
}
```

#### Get Financial Statistics

```http
GET /api/orders/stats/financial
Authorization: Bearer <token>
```

### User Management Endpoints (Admin Only)

#### Get All Users

```http
GET /api/users
Authorization: Bearer <token>
```

#### Create New User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newemployee",
  "password": "secure123",
  "role": "designer",
  "fullName": "John Doe",
  "email": "john.doe@sendroli.com"
}
```

## 🔒 Security

### Authentication & Authorization

#### JWT Token Security

- **Secure Tokens:** 256-bit secret key
- **Expiration:** 7-day default expiration
- **Automatic Refresh:** Client-side token management
- **Secure Storage:** localStorage with fallback mechanisms

#### Role-Based Access Control (RBAC)

```javascript
// Middleware checks user role before granting access
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
```

#### Password Security

- **Hashing:** bcryptjs with 10 salt rounds
- **No Plain Text:** Passwords never stored or transmitted in plain text
- **Validation:** Strong password requirements enforced

#### API Security Features

- **CORS Protection:** Configured for specific origins
- **Input Validation:** Express-validator for all inputs
- **SQL Injection Prevention:** Mongoose ODM protection
- **XSS Protection:** Input sanitization

### Environment Security

```env
# Example secure configuration
JWT_SECRET=super_long_random_string_minimum_32_characters_long
MONGODB_URI=mongodb://username:password@host:port/database
NODE_ENV=production
```

## 🧪 Testing

### Backend Testing

```bash
# Run backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### API Testing

```bash
# Using curl to test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🚀 Deployment

### Environment Setup

#### Production Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sendroli_factory
JWT_SECRET=your_production_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend (.env):**

```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_APP_NAME=Sendroli Factory Management
```

### Docker Deployment

#### Using Docker Compose

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up --build

# Production environment
docker-compose up --build -d
```

#### Manual Docker Build

```bash
# Build backend image
cd backend
docker build -t sendroli-backend .

# Build frontend image
cd frontend
docker build -t sendroli-frontend .
```

### Cloud Deployment Options

#### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Configure environment variables
3. Deploy backend and frontend as separate services

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Heroku (Backend)

```bash
# Login to Heroku
heroku login

# Create app
heroku create sendroli-backend

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri

# Deploy
git push heroku main
```

### Database Deployment

#### MongoDB Atlas (Recommended)

1. Create MongoDB Atlas cluster
2. Configure network access (IP whitelist)
3. Create database user
4. Get connection string
5. Update MONGODB_URI in environment variables

## 🛠️ Development Workflow

### Git Workflow

```bash
# Clone repository
git clone https://github.com/yourusername/sendroli-group.git

# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request
# Merge after review
```

### Development Best Practices

#### Code Standards

- **ES6+ JavaScript:** Modern JavaScript features
- **Consistent Naming:** camelCase for variables, PascalCase for components
- **Modular Code:** Separate concerns into different files
- **Error Handling:** Comprehensive try-catch blocks
- **Documentation:** JSDoc comments for functions

#### Component Structure

```javascript
// React Component Template
import React, { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Component logic
  }, [dependencies]);

  return (
    // JSX content
  );
};

export default ComponentName;
```

#### API Service Pattern

```javascript
// API Service Template
import api from './api';

export const serviceName = {
  getAll: () => api.get('/endpoint'),
  getById: (id) => api.get(`/endpoint/${id}`),
  create: (data) => api.post('/endpoint', data),
  update: (id, data) => api.put(`/endpoint/${id}`, data),
  delete: (id) => api.delete(`/endpoint/${id}`)
};
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check MongoDB service
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string
echo $MONGODB_URI
```

#### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

#### CORS Issues

```javascript
// Backend CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

#### JWT Token Issues

```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Clear localStorage in browser
localStorage.clear();
```

### Debug Mode

#### Backend Debug

```bash
# Enable debug mode
DEBUG=app:* npm run dev
```

#### Frontend Debug

```bash
# Enable React debug
REACT_APP_DEBUG=true npm start
```

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Pull Request Guidelines

- **Clear Description:** Explain what changes you made and why
- **Small Changes:** Keep PRs focused on single features/fixes
- **Tests:** Add or update tests for new functionality
- **Documentation:** Update relevant documentation
- **Code Style:** Follow existing code style and conventions

### Reporting Issues

When reporting bugs, please include:

- **Environment:** OS, Node.js version, browser
- **Steps to Reproduce:** Clear step-by-step instructions
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Screenshots:** If applicable

## 📖 Documentation

### Additional Documentation Files

| Document | Purpose |
|----------|---------|
| [📋 PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Detailed architecture and design decisions |
| [📋 IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Complete implementation status |
| [📋 GETTING_STARTED.md](./GETTING_STARTED.md) | Quick start guide for new developers |
| [📋 SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | Detailed setup instructions |
| [📋 API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | Complete API reference |
| [📋 FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Project organization guide |
| [📋 USAGE_GUIDE.md](./USAGE_GUIDE.md) | End-user manual |
| [📋 SECURITY.md](./SECURITY.md) | Security implementation details |
| [🐳 DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Docker setup and deployment |

### GitHub Copilot Integration

For enhanced development experience with GitHub Copilot, see:
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Sendroli Group

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👥 Authors

- **Sendroli Group Development Team**
- **Project Lead:** Factory Management System
- **Architecture:** MERN Stack Implementation

## 📞 Support & Contact

### Getting Help

1. **Documentation:** Check the comprehensive documentation above
2. **Issues:** Open an issue on GitHub for bugs or feature requests
3. **Discussions:** Use GitHub Discussions for questions and community support

### Project Information

- **Repository:** [Sendroli Group Factory Management](https://github.com/omarabdullah1/sendroli-group)
- **License:** MIT License
- **Version:** 1.0.0
- **Status:** ✅ Production Ready

### Quick Links

- [🚀 Quick Start](#quick-start)
- [📚 API Documentation](#api-documentation)
- [🔒 Security](#security)
- [🚀 Deployment](#deployment)
- [🐛 Troubleshooting](#troubleshooting)
- [🤝 Contributing](#contributing)

---

<div align="center">

**Built with ❤️ by the Sendroli Group Team**

*This is a complete, production-ready factory management system with comprehensive role-based access control.*

</div>
