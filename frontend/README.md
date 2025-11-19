# 🎨 Sendroli Factory Management - Frontend

<div align="center">

![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?logo=vite)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

**Modern React frontend for the Sendroli Factory Management System**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Components](#components)
- [State Management](#state-management)
- [Routing](#routing)
- [Services](#services)
- [Authentication](#authentication)
- [Role-Based Access](#role-based-access)
- [Styling](#styling)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The frontend is a modern React application built with Vite that provides a responsive, intuitive interface for managing factory operations. It features role-based access control, real-time data synchronization, and a clean, professional design.

### 🎯 Key Features

- **🔐 Role-Based Interface:** Different views for each user role
- **📱 Responsive Design:** Works seamlessly on desktop and mobile
- **⚡ Fast Performance:** Optimized with Vite and modern React patterns
- **🔄 Real-Time Updates:** Live data synchronization with backend
- **🎨 Modern UI:** Clean, professional interface design
- **♿ Accessibility:** WCAG-compliant design principles

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Core UI library |
| **Vite** | Latest | Build tool and dev server |
| **React Router DOM** | 6.15.0 | Client-side routing |
| **Axios** | 1.5.0 | HTTP client for API calls |
| **Context API** | Built-in | Global state management |
| **Modern CSS** | - | Styling and responsive design |
| **ESLint** | Latest | Code linting and quality |

## 📁 Project Structure

```
frontend/
├── 📁 public/                     # Static assets
│   ├── index.html                # Main HTML template
│   └── vite.svg                  # Application icon
│
├── 📁 src/                       # Source code
│   ├── 📁 components/            # Reusable components
│   │   ├── 📁 Auth/              # Authentication components
│   │   │   ├── Login.jsx         # Login form
│   │   │   ├── Register.jsx      # Registration form
│   │   │   └── Auth.css          # Auth-specific styles
│   │   ├── 📁 Clients/           # Client management
│   │   │   ├── ClientList.jsx    # Client listing table
│   │   │   ├── ClientForm.jsx    # Create/edit client form
│   │   │   ├── ClientDetail.jsx  # Client details view
│   │   │   └── Clients.css       # Client-specific styles
│   │   ├── 📁 Orders/            # Order management
│   │   │   ├── OrderList.jsx     # Order listing table
│   │   │   ├── OrderForm.jsx     # Create/edit order form
│   │   │   ├── OrderDetail.jsx   # Order details view
│   │   │   └── Orders.css        # Order-specific styles
│   │   ├── 📁 Dashboard/         # Dashboard components
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   └── Dashboard.css     # Dashboard styles
│   │   ├── 📁 Layout/            # Layout components
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   └── Layout.css        # Layout styles
│   │   ├── Navbar.js             # Navigation component
│   │   └── PrivateRoute.js       # Route protection
│   │
│   ├── 📁 context/               # React Context providers
│   │   └── AuthContext.jsx       # Authentication state
│   │
│   ├── 📁 pages/                 # Page components
│   │   ├── Home.js               # Homepage
│   │   ├── Login.js              # Login page
│   │   ├── Clients.js            # Clients management page
│   │   ├── Orders.js             # Orders management page
│   │   ├── FinancialStats.js     # Financial dashboard
│   │   ├── Users.js              # User management (admin)
│   │   └── Unauthorized.js       # Access denied page
│   │
│   ├── 📁 services/              # API service layer
│   │   ├── api.js                # Axios configuration
│   │   ├── authService.js        # Authentication API
│   │   ├── clientService.js      # Client management API
│   │   ├── orderService.js       # Order management API
│   │   └── userService.js        # User management API
│   │
│   ├── 📁 utils/                 # Utility functions
│   │   └── ProtectedRoute.jsx    # Route protection utility
│   │
│   ├── 📁 assets/                # Static assets
│   │   └── react.svg             # React logo
│   │
│   ├── App.jsx                   # Main application component
│   ├── App.css                   # Global application styles
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Base CSS styles
│
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── eslint.config.js              # ESLint configuration
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Backend server** running on `http://localhost:5000`

### Installation

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

4. **Configure environment variables:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Sendroli Factory Management
   VITE_APP_VERSION=1.0.0
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 🧩 Components

### Authentication Components

#### Login Component (`components/Auth/Login.jsx`)
```jsx
// Handles user authentication
const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const handleSubmit = async (e) => {
    // Login logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Login form fields */}
    </form>
  );
};
```

#### Register Component (`components/Auth/Register.jsx`)
```jsx
// Admin-only user registration
const Register = () => {
  // Registration form for creating new users
};
```

### Client Management Components

#### ClientList Component (`components/Clients/ClientList.jsx`)
- **Purpose:** Display all clients in a table format
- **Features:** Search, pagination, role-based actions
- **Access:** Receptionist, Admin

#### ClientForm Component (`components/Clients/ClientForm.jsx`)
- **Purpose:** Create and edit client information
- **Features:** Form validation, auto-save drafts
- **Access:** Receptionist, Admin

#### ClientDetail Component (`components/Clients/ClientDetail.jsx`)
- **Purpose:** Show detailed client information
- **Features:** Contact details, order history
- **Access:** All roles (read-only for some)

### Order Management Components

#### OrderList Component (`components/Orders/OrderList.jsx`)
- **Purpose:** Display orders based on user role
- **Features:** Status filtering, role-specific columns
- **Access:** Designer, Financial, Admin

#### OrderForm Component (`components/Orders/OrderForm.jsx`)
- **Purpose:** Create and edit orders
- **Features:** Client selection, price calculations
- **Access:** Admin

#### OrderDetail Component (`components/Orders/OrderDetail.jsx`)
- **Purpose:** Show detailed order information
- **Features:** Payment tracking, status updates
- **Access:** Designer, Financial, Admin

### Layout Components

#### Layout Component (`components/Layout/Layout.jsx`)
```jsx
const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
```

#### Navbar Component (`components/Navbar.js`)
```jsx
const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <div className="nav-brand">Sendroli Factory</div>
      <div className="nav-links">
        {/* Role-based navigation items */}
      </div>
      <div className="nav-user">
        <span>{user?.fullName}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};
```

## 🗄️ State Management

### Auth Context (`context/AuthContext.jsx`)

```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response.data.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### State Management Patterns

#### Component State
```jsx
// Local component state for form data
const [formData, setFormData] = useState({
  name: '',
  phone: '',
  factoryName: ''
});

// Handle form field changes
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};
```

#### Global State (Context)
```jsx
// Authentication state (global)
const { user, login, logout } = useAuth();

// Loading states
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

## 🗺️ Routing

### Route Configuration (`App.jsx`)

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Home />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Role-Based Routes */}
          <Route path="/clients" element={
            <PrivateRoute allowedRoles={['receptionist', 'admin']}>
              <Layout>
                <Clients />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/orders" element={
            <PrivateRoute allowedRoles={['designer', 'financial', 'admin']}>
              <Layout>
                <Orders />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout>
                <Users />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### Protected Route Implementation (`utils/ProtectedRoute.jsx`)

```jsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

## 🔌 Services

### API Configuration (`services/api.js`)

```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Patterns

#### Client Service (`services/clientService.js`)
```jsx
import api from './api';

export const clientService = {
  // Get all clients
  getAll: () => api.get('/clients'),
  
  // Get client by ID
  getById: (id) => api.get(`/clients/${id}`),
  
  // Create new client
  create: (clientData) => api.post('/clients', clientData),
  
  // Update client
  update: (id, clientData) => api.put(`/clients/${id}`, clientData),
  
  // Delete client
  delete: (id) => api.delete(`/clients/${id}`),
  
  // Search clients
  search: (query) => api.get(`/clients?search=${query}`)
};
```

#### Order Service (`services/orderService.js`)
```jsx
import api from './api';

export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  getFinancialStats: () => api.get('/orders/stats/financial'),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updatePayment: (id, paymentData) => api.patch(`/orders/${id}/payment`, paymentData)
};
```

## 🔐 Authentication

### Login Flow

1. **User submits credentials**
2. **Frontend calls login API**
3. **Backend validates and returns JWT token**
4. **Frontend stores token in localStorage**
5. **User state updated in AuthContext**
6. **User redirected to dashboard**

### Token Management

```jsx
// Token storage
localStorage.setItem('token', response.data.token);

// Token retrieval
const token = localStorage.getItem('token');

// Token removal (logout)
localStorage.removeItem('token');

// Automatic token injection (axios interceptor)
config.headers.Authorization = `Bearer ${token}`;
```

### Session Management

```jsx
// Check for existing session on app load
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token with backend
    authService.verifyToken()
      .then(user => setUser(user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  }
  setLoading(false);
}, []);
```

## 👥 Role-Based Access

### Role Definitions

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Receptionist** | Client Management | Create, edit, delete clients |
| **Designer** | Order Viewing | View orders, update status |
| **Financial** | Payment Management | View orders, edit payments |
| **Admin** | Full Access | All operations + user management |

### Role-Based Component Rendering

```jsx
const OrderActions = ({ order, userRole }) => {
  return (
    <div className="order-actions">
      {/* Designer can update status */}
      {userRole === 'designer' && (
        <select 
          value={order.status} 
          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
          <option value="delivered">Delivered</option>
        </select>
      )}
      
      {/* Financial can edit payments */}
      {(userRole === 'financial' || userRole === 'admin') && (
        <button onClick={() => openPaymentModal(order)}>
          Edit Payment
        </button>
      )}
      
      {/* Admin can delete */}
      {userRole === 'admin' && (
        <button 
          onClick={() => deleteOrder(order.id)}
          className="btn-danger"
        >
          Delete
        </button>
      )}
    </div>
  );
};
```

### Role-Based Navigation

```jsx
const Navbar = () => {
  const { user } = useAuth();
  
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/', label: 'Dashboard', roles: ['all'] }
    ];
    
    const roleBasedItems = [
      { path: '/clients', label: 'Clients', roles: ['receptionist', 'admin'] },
      { path: '/orders', label: 'Orders', roles: ['designer', 'financial', 'admin'] },
      { path: '/financial', label: 'Financial', roles: ['financial', 'admin'] },
      { path: '/users', label: 'Users', roles: ['admin'] }
    ];
    
    return [...baseItems, ...roleBasedItems.filter(item => 
      item.roles.includes('all') || item.roles.includes(user.role)
    )];
  };
  
  return (
    <nav>
      {getNavigationItems().map(item => (
        <Link key={item.path} to={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
```

## 🎨 Styling

### CSS Architecture

The application uses a modern CSS approach with:
- **CSS Modules:** Component-scoped styling
- **CSS Custom Properties:** Consistent theming
- **Flexbox/Grid:** Modern layout patterns
- **Responsive Design:** Mobile-first approach

### Theme System (`index.css`)

```css
:root {
  /* Primary Colors */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #dbeafe;
  
  /* Secondary Colors */
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Neutral Colors */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Typography */
  --font-family: 'Inter', system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Component Styling Examples

#### Button Styles (`App.css`)
```css
.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: 0.375rem;
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-gray-100);
  color: var(--color-gray-800);
}
```

#### Table Styles
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-white);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-md);
}

.data-table th {
  background-color: var(--color-gray-50);
  padding: var(--spacing-4);
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-800);
}

.data-table td {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-100);
}
```

### Responsive Design

```css
/* Mobile First Approach */
.container {
  padding: var(--spacing-4);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## 🔧 Development

### Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **dev** | `npm run dev` | Start development server |
| **build** | `npm run build` | Build for production |
| **preview** | `npm run preview` | Preview production build |
| **lint** | `npm run lint` | Run ESLint |
| **lint:fix** | `npm run lint:fix` | Fix ESLint errors |

### Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-component
   
   # Start development server
   npm run dev
   
   # Make changes
   # Test changes
   
   # Lint code
   npm run lint:fix
   ```

2. **Component Creation Pattern**
   ```bash
   # Create component directory
   mkdir src/components/NewComponent
   
   # Create component files
   touch src/components/NewComponent/NewComponent.jsx
   touch src/components/NewComponent/NewComponent.css
   touch src/components/NewComponent/index.js
   ```

3. **Component Template**
   ```jsx
   // NewComponent.jsx
   import React, { useState, useEffect } from 'react';
   import './NewComponent.css';
   
   const NewComponent = ({ prop1, prop2 }) => {
     const [state, setState] = useState(null);
     
     useEffect(() => {
       // Component logic
     }, []);
     
     return (
       <div className="new-component">
         {/* Component content */}
       </div>
     );
   };
   
   export default NewComponent;
   ```

### Environment Variables

Create `.env` file with:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Sendroli Factory Management
VITE_APP_VERSION=1.0.0

# Development
VITE_DEBUG=true
```

### Vite Configuration (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    global: 'globalThis',
  }
})
```

## 📦 Build & Deployment

### Production Build

1. **Create production build:**
   ```bash
   npm run build
   ```

2. **Preview build locally:**
   ```bash
   npm run preview
   ```

3. **Build output:**
   ```
   dist/
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   ├── index.html
   └── vite.svg
   ```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Builds

#### Development
```env
VITE_API_URL=http://localhost:5000/api
VITE_DEBUG=true
```

#### Staging
```env
VITE_API_URL=https://staging-api.sendroli.com/api
VITE_DEBUG=false
```

#### Production
```env
VITE_API_URL=https://api.sendroli.com/api
VITE_DEBUG=false
```

## 🧪 Testing

### Test Structure

```
src/
├── __tests__/           # Global tests
├── components/
│   └── __tests__/       # Component tests
├── services/
│   └── __tests__/       # Service tests
└── utils/
    └── __tests__/       # Utility tests
```

### Component Testing Example

```jsx
// ClientList.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ClientList from '../ClientList';
import { AuthProvider } from '../../context/AuthContext';

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('ClientList', () => {
  test('renders client list', () => {
    const mockClients = [
      { id: 1, name: 'Test Client', phone: '123-456-7890' }
    ];
    
    renderWithAuth(<ClientList clients={mockClients} />);
    
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
  });
  
  test('handles client deletion', () => {
    const mockDelete = jest.fn();
    const mockClients = [
      { id: 1, name: 'Test Client', phone: '123-456-7890' }
    ];
    
    renderWithAuth(
      <ClientList clients={mockClients} onDelete={mockDelete} />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockDelete).toHaveBeenCalledWith(1);
  });
});
```

### Service Testing Example

```jsx
// clientService.test.js
import { clientService } from '../clientService';
import api from '../api';

jest.mock('../api');

describe('clientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('getAll returns client list', async () => {
    const mockClients = [{ id: 1, name: 'Test Client' }];
    api.get.mockResolvedValue({ data: mockClients });
    
    const result = await clientService.getAll();
    
    expect(api.get).toHaveBeenCalledWith('/clients');
    expect(result.data).toEqual(mockClients);
  });
  
  test('create sends correct data', async () => {
    const clientData = { name: 'New Client', phone: '123-456-7890' };
    const mockResponse = { data: { id: 1, ...clientData } };
    
    api.post.mockResolvedValue(mockResponse);
    
    const result = await clientService.create(clientData);
    
    expect(api.post).toHaveBeenCalledWith('/clients', clientData);
    expect(result.data.name).toBe('New Client');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test ClientList.test.jsx
```

## 🐛 Troubleshooting

### Common Issues

#### API Connection Issues
```javascript
// Check API URL configuration
console.log('API URL:', import.meta.env.VITE_API_URL);

// Verify backend is running
fetch('http://localhost:5000/api/health')
  .then(response => console.log('Backend status:', response.status))
  .catch(error => console.error('Backend not reachable:', error));
```

#### Authentication Issues
```javascript
// Check token in localStorage
console.log('Stored token:', localStorage.getItem('token'));

// Verify token format
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
  } catch (error) {
    console.error('Invalid token format');
  }
}
```

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npx vite --force

# Check for conflicting dependencies
npm ls
```

#### CORS Issues
```javascript
// Verify CORS configuration in backend
// Check browser console for CORS errors
// Ensure backend allows frontend origin

// Temporary CORS bypass for development (not for production)
// Add to vite.config.js:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api')
    }
  }
}
```

### Performance Issues

#### Bundle Size Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npx bundlephobia [package-name]
```

#### Memory Leaks
```javascript
// Component cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Some logic
  }, 1000);

  // Cleanup
  return () => clearInterval(interval);
}, []);

// Event listener cleanup
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);
  
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Debug Mode

Enable debug mode in development:

```jsx
// Add to main.jsx
if (import.meta.env.VITE_DEBUG === 'true') {
  // Enable React DevTools
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
  
  // Log API calls
  api.interceptors.request.use(request => {
    console.log('API Request:', request);
    return request;
  });
  
  api.interceptors.response.use(response => {
    console.log('API Response:', response);
    return response;
  });
}
```

---

## 📞 Support

### Getting Help

1. **Check Documentation:** Review this comprehensive guide
2. **Backend Issues:** Check the [backend README](../backend/README.md)
3. **GitHub Issues:** Open an issue for bugs or feature requests
4. **Development Discussion:** Use GitHub Discussions

### Useful Resources

- **React Documentation:** [react.dev](https://react.dev)
- **Vite Documentation:** [vitejs.dev](https://vitejs.dev)
- **React Router:** [reactrouter.com](https://reactrouter.com)
- **Axios Documentation:** [axios-http.com](https://axios-http.com)

---

<div align="center">

**🎨 Modern React Frontend for Sendroli Factory Management**

*Built with React 18, Vite, and modern web technologies*

[📋 Back to Main README](../README.md)

</div>
