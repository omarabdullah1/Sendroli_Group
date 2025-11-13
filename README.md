# Mostafa Factory Management System

A comprehensive MERN stack application for managing factory operations with role-based access control.

## 🚀 Features

- **Multi-Role Access Control:** Receptionist, Designer, Financial, and Admin roles
- **Client Management:** Complete CRUD operations for client records
- **Order Management:** Track orders with detailed information and status updates
- **Financial Tracking:** Monitor payments, deposits, and remaining balances
- **JWT Authentication:** Secure token-based authentication
- **Role-Based Authorization:** Middleware protection for API routes

## 📋 System Roles

### Receptionist
- Manage client records (create, view, update, delete)

### Designer
- View and update orders related to designs
- View client information (read-only)

### Financial
- Manage payments and deposits
- View financial summaries and reports

### Admin
- Full system access
- User management
- Complete control over all entities

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Context API** - State management
- **Axios** - HTTP client

## 📁 Project Structure

```
Mostafa_Sys/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── scripts/            # Seed and utility scripts
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Backend dependencies
│   └── server.js           # Application entry point
│
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Application entry
│   ├── .env.example        # Environment variables template
│   └── package.json        # Frontend dependencies
│
├── docs/                   # Documentation
└── PROJECT_OVERVIEW.md     # Detailed project overview
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/factory_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the frontend:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Users (After Seeding)

After running the seed script, you can login with these default accounts:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| receptionist | recep123 | Receptionist |
| designer | design123 | Designer |
| financial | finance123 | Financial |

**⚠️ Important:** Change these passwords in production!

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Orders
- `GET /api/orders` - List orders (role-filtered)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order (admin only)

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Run `npm install --production`
3. Start with `npm start`

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy the `build` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Factory Management System Team

## 📞 Support

For issues and questions, please open an issue on GitHub.

