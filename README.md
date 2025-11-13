# Factory Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing factory operations with role-based access control.

## Features

### User Roles & Access Control
- **Admin**: Full access to all features including user management
- **Financial**: Access to financial data, can delete orders
- **Designer**: Access to orders and clients
- **Receptionist**: Basic access to clients and orders

### Core Functionality
- **User Authentication**: JWT-based authentication system
- **Client Management**: Add, edit, view, and delete clients with factory information
- **Order Management**: Create and manage orders with status tracking (pending, active, done, delivered)
- **Dashboard**: Overview of orders, revenue, and statistics
- **Role-Based Access**: Different permissions for different user roles

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Context API for state management
- CSS3 for styling

## Project Structure

```
Mostafa_Sys/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication & error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Express server setup
│   ├── .env.example        # Environment variables template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   │   ├── Auth/       # Login & Register
    │   │   ├── Clients/    # Client management
    │   │   ├── Dashboard/  # Dashboard view
    │   │   ├── Layout/     # App layout
    │   │   └── Orders/     # Order management
    │   ├── context/        # React Context (Auth)
    │   ├── services/       # API services
    │   ├── utils/          # Utility functions
    │   └── App.jsx         # Main app component
    ├── .env.example        # Environment variables template
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/factory_management
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your backend URL:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (Admin only)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order (Admin/Financial only)

## Default User

After setting up, you'll need to register the first admin user through the registration endpoint or UI.

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization with express-validator
- Protected routes on both frontend and backend
- HTTP-only considerations for production

### Production Recommendations

For production deployment, consider adding:
- Rate limiting middleware (e.g., `express-rate-limit`)
- Helmet.js for security headers
- CORS configuration specific to your domain
- MongoDB connection with SSL/TLS
- Environment-specific configurations

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Uses Vite's HMR
```

### Production Build

Frontend:
```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC

## Author

Factory Management System Development Team
