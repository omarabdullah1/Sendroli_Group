# Factory Management System - Folder Structure

```
Mostafa_Sys/
│
├── README.md                           # Main project documentation
├── PROJECT_OVERVIEW.md                 # Detailed system architecture and design
├── FOLDER_STRUCTURE.md                 # This file - project structure overview
│
├── backend/                            # Node.js + Express backend
│   ├── config/
│   │   └── database.js                 # MongoDB connection configuration
│   │
│   ├── controllers/                    # Route handlers and business logic
│   │   ├── authController.js           # Authentication logic (login, register)
│   │   ├── clientController.js         # Client CRUD operations
│   │   ├── orderController.js          # Order CRUD and financial stats
│   │   └── userController.js           # User management (admin only)
│   │
│   ├── middleware/                     # Custom middleware functions
│   │   ├── auth.js                     # JWT authentication & role authorization
│   │   └── errorHandler.js            # Global error handling
│   │
│   ├── models/                         # Mongoose data models
│   │   ├── User.js                     # User schema with password hashing
│   │   ├── Client.js                   # Client schema
│   │   └── Order.js                    # Order schema with auto-calculations
│   │
│   ├── routes/                         # API route definitions
│   │   ├── authRoutes.js               # /api/auth/* routes
│   │   ├── clientRoutes.js             # /api/clients/* routes
│   │   ├── orderRoutes.js              # /api/orders/* routes
│   │   └── userRoutes.js               # /api/users/* routes
│   │
│   ├── scripts/                        # Utility scripts
│   │   └── seedData.js                 # Database seeding script
│   │
│   ├── utils/                          # Helper functions
│   │   └── generateToken.js            # JWT token generation
│   │
│   ├── .env.example                    # Environment variables template
│   ├── .gitignore                      # Git ignore rules for backend
│   ├── package.json                    # Backend dependencies and scripts
│   └── server.js                       # Application entry point
│
├── frontend/                           # React frontend application
│   ├── public/
│   │   └── index.html                  # HTML template
│   │
│   ├── src/
│   │   ├── components/                 # Reusable React components
│   │   │   ├── Navbar.js               # Navigation bar with role-based menu
│   │   │   └── PrivateRoute.js         # Protected route wrapper
│   │   │
│   │   ├── contexts/                   # React Context providers
│   │   │   └── AuthContext.js          # Authentication state management
│   │   │
│   │   ├── pages/                      # Page components
│   │   │   ├── Login.js                # Login page
│   │   │   ├── Home.js                 # Dashboard/home page
│   │   │   ├── Clients.js              # Client management (receptionist/admin)
│   │   │   ├── Orders.js               # Order management (designer/financial/admin)
│   │   │   ├── FinancialStats.js       # Financial statistics (financial/admin)
│   │   │   ├── Users.js                # User management (admin only)
│   │   │   └── Unauthorized.js         # 403 error page
│   │   │
│   │   ├── services/                   # API communication layer
│   │   │   ├── api.js                  # Axios instance with interceptors
│   │   │   ├── authService.js          # Authentication API calls
│   │   │   ├── clientService.js        # Client API calls
│   │   │   ├── orderService.js         # Order API calls
│   │   │   └── userService.js          # User API calls
│   │   │
│   │   ├── App.js                      # Main app component with routing
│   │   ├── index.js                    # React entry point
│   │   └── index.css                   # Global styles
│   │
│   ├── .env.example                    # Environment variables template
│   ├── .gitignore                      # Git ignore rules for frontend
│   └── package.json                    # Frontend dependencies and scripts
│
└── docs/                               # Documentation files
    ├── SETUP_GUIDE.md                  # Detailed setup instructions
    └── API_DOCUMENTATION.md            # Complete API reference
```

## Key Directories Explained

### Backend Structure

**config/** - Configuration files for database and other services
- Database connection setup with error handling

**controllers/** - Business logic and request handlers
- Each controller handles a specific entity (auth, clients, orders, users)
- Implements role-based logic for data access

**middleware/** - Request processing middleware
- Authentication verification
- Role-based authorization
- Error handling

**models/** - Data models and schemas
- Mongoose schemas with validation
- Pre-save hooks for data processing
- Virtual fields and methods

**routes/** - API endpoint definitions
- RESTful route organization
- Middleware application for protection
- Role-based route access control

**scripts/** - Utility scripts
- Database seeding with sample data
- Future: migration scripts, backup scripts

**utils/** - Helper functions
- Token generation
- Future: email sending, file upload handlers

### Frontend Structure

**components/** - Reusable UI components
- Navbar with role-based menu
- PrivateRoute for protected pages
- Future: forms, tables, modals

**contexts/** - Global state management
- Authentication context
- Future: theme context, notification context

**pages/** - Full page components
- Each major feature has its own page
- Role-specific access and functionality

**services/** - API communication
- Centralized API calls
- Request/response interceptors
- Error handling

## File Naming Conventions

- **PascalCase**: React components, models, contexts (e.g., `AuthContext.js`, `User.js`)
- **camelCase**: Controllers, services, utilities (e.g., `authController.js`, `authService.js`)
- **kebab-case**: Route files (e.g., `auth-routes.js` could be used)
- **UPPERCASE**: Documentation files (e.g., `README.md`, `SETUP_GUIDE.md`)

## Environment Files

Both backend and frontend have `.env.example` files that need to be copied to `.env` and configured:

**Backend `.env` requirements:**
- PORT
- MONGODB_URI
- JWT_SECRET
- JWT_EXPIRE
- FRONTEND_URL

**Frontend `.env` requirements:**
- REACT_APP_API_URL

## Git Ignore Patterns

Both `.gitignore` files exclude:
- `node_modules/`
- `.env` files
- Build artifacts
- IDE-specific files
- Log files

## Module Organization

### Backend Modules

1. **Authentication Module**: auth controller + routes + middleware
2. **Client Module**: client model + controller + routes
3. **Order Module**: order model + controller + routes
4. **User Module**: user model + controller + routes

### Frontend Modules

1. **Authentication Module**: AuthContext + authService + Login page
2. **Client Module**: Clients page + clientService
3. **Order Module**: Orders page + orderService
4. **User Module**: Users page + userService
5. **Financial Module**: FinancialStats page + financial endpoints

## Scalability Considerations

This structure supports:
- **Horizontal scaling**: Stateless backend can run multiple instances
- **Vertical scaling**: Modular code allows performance optimization
- **Feature additions**: New modules follow established patterns
- **Testing**: Clear separation makes unit/integration testing easier
- **Maintenance**: Organized structure improves code maintainability
