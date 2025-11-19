# 🚀 Getting Started with Sendroli Factory Management System

Welcome to the Sendroli Factory Management System! This guide will help you get up and running quickly with our comprehensive MERN stack application.

## 📋 Quick Start (5 minutes)

### Prerequisites Check

Before starting, make sure you have:

```bash
# Check Node.js (should be v16+)
node --version

# Check npm
npm --version

# Check MongoDB (should be v4.4+)
mongod --version
```

If any of these are missing, install them from:
- **Node.js:** [https://nodejs.org/](https://nodejs.org/)
- **MongoDB:** [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

### 🔧 Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sendroli_Group
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env if needed (default values work for local development)
   ```

3. **Start MongoDB**
   ```bash
   # On macOS (with Homebrew)
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows - MongoDB should auto-start or use Services
   ```

4. **Seed the Database**
   ```bash
   npm run seed
   ```
   
   This creates 4 default users with different roles and sample data.

5. **Start Backend** (in backend directory)
   ```bash
   npm run dev
   ```
   
   Backend will run on **http://localhost:5000**

6. **Frontend Setup** (open new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   
   Frontend will open at **http://localhost:3000**

### 🔐 First Login

After seeding, you can login with these accounts:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | admin | admin123 | Full system control |
| **Receptionist** | receptionist | recep123 | Client management only |
| **Designer** | designer | design123 | Order viewing and status updates |
| **Financial** | financial | finance123 | Payment management and reports |

**⚠️ Important:** Change these passwords immediately in production!

## 👥 What Each Role Can Do

### 👑 Admin (Full System Access)
- ✅ Manage all clients (create, edit, delete)
- ✅ Manage all orders (full control)
- ✅ Manage system users (create, edit, activate/deactivate)
- ✅ View all financial statistics and reports
- ✅ Access all system features

**Try this:** Login as `admin`, explore all menu items and features

### 📝 Receptionist (Client Relationship Management)
- ✅ Add new clients with complete contact information
- ✅ View and search all clients
- ✅ Edit client information and factory details
- ✅ Delete client records
- ❌ Cannot access orders, financial data, or user management

**Try this:** Login as `receptionist`, add a new client with factory information

### 🎨 Designer (Order Management & Design Workflow)
- ✅ View all orders with detailed specifications
- ✅ Update order status (pending → active → done → delivered)
- ✅ View client information (read-only)
- ✅ Track order progress and design requirements
- ❌ Cannot modify pricing, payments, or manage clients

**Try this:** Login as `designer`, change an order status through the workflow

### 💰 Financial (Payment & Financial Management)
- ✅ View all orders with financial details
- ✅ Update payment information (deposits, total pricing)
- ✅ View comprehensive financial statistics
- ✅ Generate financial reports and summaries
- ✅ View client information (read-only)
- ❌ Cannot change order status or manage clients

**Try this:** Login as `financial`, update payment information and view financial reports

## 📊 Key Features to Explore

### 1. 👥 Client Management (Receptionist/Admin)
- **Add New Clients:** Complete contact information and factory details
- **Search & Filter:** Find clients by name, phone, or factory name
- **Edit Records:** Update contact information and notes
- **Delete Clients:** Remove clients (with proper authorization)
- **Client History:** View associated orders and interactions

### 2. 📋 Order Management (Designer/Financial/Admin)
- **View All Orders:** Comprehensive order listing with client information
- **Status Updates:** Track order progress through workflow states
- **Filter & Search:** Find orders by status, client, or date
- **Role-Based Updates:**
  - **Designer:** Update order status and add notes
  - **Financial:** Update payments and pricing
  - **Admin:** Full control over all order aspects

### 3. 💰 Financial Statistics (Financial/Admin)
- **Revenue Tracking:** Total revenue, deposits, and outstanding amounts
- **Order Analytics:** Statistics by order status and client
- **Payment Management:** Track deposits and remaining balances
- **Financial Reports:** Comprehensive financial summaries

### 4. 👤 User Management (Admin Only)
- **User Administration:** View and manage all system users
- **Role Assignment:** Create users with appropriate roles
- **Account Control:** Activate/deactivate user accounts
- **Access Management:** Control user permissions and access levels

## 🔄 Common Workflow Tasks

### Adding a New Client
1. Login as `receptionist` or `admin`
2. Navigate to **Clients** page
3. Click **"Add New Client"** button
4. Fill in client information:
   - Client name (required)
   - Phone number (required)
   - Factory name (optional)
   - Address (optional)
   - Notes (optional)
5. Click **"Create Client"**
6. Client appears in the list immediately

### Creating an Order
1. Login as `admin`
2. Navigate to **Orders** page
3. Click **"Create Order"**
4. Select existing client or create new client
5. Fill in order details:
   - Repeats/quantity
   - Sheet size
   - Type/specifications
   - Total price
   - Initial deposit
6. Click **"Create Order"**
7. Order is created with "pending" status

### Updating Order Status (Designer Workflow)
1. Login as `designer`
2. Navigate to **Orders** page
3. Find the order to update
4. Use status dropdown to change:
   - **Pending** → **Active** (work started)
   - **Active** → **Done** (work completed)
   - **Done** → **Delivered** (delivered to client)
5. Status updates automatically and triggers notifications

### Recording Payments (Financial Workflow)
1. Login as `financial` or `admin`
2. Navigate to **Orders** page
3. Click on order to edit payment information
4. Update deposit amount
5. System automatically calculates remaining balance
6. Save changes to update financial records

## 🧪 Testing Role-Based Access Control

### Verify Security Implementation

1. **Test Receptionist Restrictions:**
   - Login as `receptionist`
   - Should ONLY see "Clients" in navigation
   - Try accessing `/orders` directly → should be redirected to unauthorized page
   - Cannot access financial data or user management

2. **Test Designer Limitations:**
   - Login as `designer`
   - Should ONLY see "Orders" in navigation
   - Can change order status but cannot modify pricing
   - Cannot access client management or user administration

3. **Test Financial Permissions:**
   - Login as `financial`
   - Should see "Orders" and "Financial Stats" in navigation
   - Can update payment information but not order status
   - Cannot access client management or user administration

4. **Test Admin Full Access:**
   - Login as `admin`
   - Should see ALL navigation items
   - Full access to all features and data
   - Can manage users, clients, orders, and view all reports

## 🔌 API Testing

For developers who want to test the API directly:

```bash
# Health check
curl http://localhost:5000/api/health

# User login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get all clients (requires authentication token)
curl http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Create new client
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{"name":"Test Company","phone":"+1234567890","factoryName":"Test Factory"}'

# Get financial statistics
curl http://localhost:5000/api/orders/stats/financial \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🐛 Troubleshooting

### Backend Issues

#### MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

#### Port Already in Use
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

#### Environment Variables Not Loading
```bash
# Verify .env file exists
ls -la backend/.env

# Check environment variables are set
node -e "console.log(process.env.MONGODB_URI)"
```

### Frontend Issues

#### Port 3000 Already in Use
```bash
# Kill process using port 3000
npx kill-port 3000

# Or start on different port
npm start -- --port 3001
```

#### API Connection Errors
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS configuration
# Ensure CORS_ORIGIN in backend .env matches frontend URL
```

### Authentication Issues

#### Cannot Login
- Ensure database is seeded: `npm run seed` in backend directory
- Check username/password spelling (case-sensitive)
- Verify JWT_SECRET is set in backend .env

#### Token Expired
- Tokens expire after 7 days by default
- Login again to get new token
- Clear browser localStorage if having issues

### Database Issues

#### Seed Script Fails
```bash
# Clear database and retry
mongo sendroli_factory --eval "db.dropDatabase()"
npm run seed
```

#### Validation Errors
- Check required fields are provided
- Verify data types match schema requirements
- Review validation error messages for specific issues

## 📚 Next Steps

### For Developers
1. **Architecture Deep Dive:** Read [README.md](./README.md) for comprehensive project overview
2. **Backend Development:** Check [backend/README.md](./backend/README.md) for API details
3. **Frontend Development:** Review [frontend/README.md](./frontend/README.md) for React patterns
4. **GitHub Copilot:** See [.github/copilot-instructions.md](./.github/copilot-instructions.md) for development guidelines

### For System Administrators
1. **Security Configuration:** Review [SECURITY.md](./SECURITY.md) for security best practices
2. **Deployment Guide:** Check deployment sections in main documentation
3. **Docker Setup:** Use [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) for containerized deployment
4. **Environment Setup:** Configure production environment variables

### For End Users
1. **User Manual:** Read [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed feature documentation
2. **Change Default Passwords:** Update all default user passwords immediately
3. **Create Real Users:** Set up actual system users with appropriate roles
4. **Import Data:** Add real client and order data to the system

### For DevOps/Production
1. **Production Checklist:** Review deployment requirements and security measures
2. **Database Setup:** Configure MongoDB Atlas or production database
3. **Environment Variables:** Set up production environment configuration
4. **Monitoring:** Implement application monitoring and logging
5. **Backup Strategy:** Set up regular database backups

## 📖 Documentation Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [README.md](./README.md) | Complete project overview and setup | Starting point for understanding the system |
| [backend/README.md](./backend/README.md) | Backend API documentation | Developing backend features or integrating APIs |
| [frontend/README.md](./frontend/README.md) | Frontend documentation | Developing UI components or understanding React structure |
| [.github/copilot-instructions.md](./.github/copilot-instructions.md) | GitHub Copilot context | Using AI assistance for development |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | Complete API reference | Detailed API endpoint documentation |
| [SECURITY.md](./SECURITY.md) | Security implementation | Understanding security measures and best practices |
| [USAGE_GUIDE.md](./USAGE_GUIDE.md) | End-user manual | Learning how to use the system features |
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Docker deployment | Containerized deployment and development |

## 💬 Getting Help

If you encounter issues not covered in this guide:

### Documentation First
1. Check the comprehensive [README.md](./README.md)
2. Review role-specific documentation
3. Check troubleshooting sections

### Development Issues
1. Review [.github/copilot-instructions.md](./.github/copilot-instructions.md) for coding guidelines
2. Check backend/frontend specific README files
3. Review API documentation for endpoint details

### System Configuration
1. Check [SECURITY.md](./SECURITY.md) for security configuration
2. Review environment variable requirements
3. Check database connection and configuration

### Community Support
1. Open an issue on GitHub with detailed problem description
2. Include error messages, logs, and steps to reproduce
3. Specify your environment (OS, Node.js version, MongoDB version)

## 🤝 Contributing

We welcome contributions! To get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Follow coding guidelines:** Review [.github/copilot-instructions.md](./.github/copilot-instructions.md)
4. **Write tests:** Add tests for new functionality
5. **Update documentation:** Keep documentation current with changes
6. **Submit pull request:** Include clear description of changes

### Development Workflow
1. Read the comprehensive documentation
2. Set up development environment using this guide
3. Review existing code patterns and conventions
4. Implement changes following established patterns
5. Test thoroughly with different user roles
6. Update relevant documentation

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🚀 Ready to explore the Sendroli Factory Management System?**

*Follow the Quick Start section above and start managing your factory operations efficiently!*

**[📋 Main Documentation](./README.md)** | **[🔧 Backend Guide](./backend/README.md)** | **[🎨 Frontend Guide](./frontend/README.md)**

</div>

### Prerequisites Check

Before starting, make sure you have:

```bash
# Check Node.js (should be v14+)
node --version

# Check npm
npm --version

# Check MongoDB (should be v4.4+)
mongod --version
```

If any of these are missing, install them from:
- Node.js: https://nodejs.org/
- MongoDB: https://www.mongodb.com/try/download/community

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Mostafa_Sys
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env if needed (default values work for local development)
   ```

3. **Start MongoDB**
   ```bash
   # On macOS
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   
   # On Windows - MongoDB should auto-start or use Services
   ```

4. **Seed the Database**
   ```bash
   npm run seed
   ```
   
   This creates 4 default users and sample data.

5. **Start Backend** (in backend directory)
   ```bash
   npm run dev
   ```
   
   Backend will run on http://localhost:5000

6. **Frontend Setup** (open new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```
   
   Frontend will open at http://localhost:3000

### First Login

After seeding, you can login with these accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Receptionist | receptionist | recep123 |
| Designer | designer | design123 |
| Financial | financial | finance123 |

## What Each Role Can Do

### 👔 Admin (Full Access)
- ✅ Manage all clients
- ✅ Manage all orders
- ✅ Manage all users
- ✅ View financial statistics
- ✅ Full system control

**Try this:** Login as `admin`, explore all menu items

### 📝 Receptionist (Client Management)
- ✅ Add new clients
- ✅ View all clients
- ✅ Edit client information
- ✅ Delete clients
- ❌ Cannot access orders or financial data

**Try this:** Login as `receptionist`, add a new client

### 🎨 Designer (Order Status)
- ✅ View all orders
- ✅ Update order status (pending → active → done → delivered)
- ✅ View client information (read-only)
- ❌ Cannot modify prices or payments

**Try this:** Login as `designer`, change an order status

### 💰 Financial (Payment Management)
- ✅ View all orders
- ✅ Update payment information (deposits, total price)
- ✅ View financial statistics and summaries
- ✅ View client information (read-only)
- ❌ Cannot change order status

**Try this:** Login as `financial`, view financial stats

## Project Structure at a Glance

```
Mostafa_Sys/
├── backend/              # Node.js + Express API
│   ├── models/           # Database schemas
│   ├── controllers/      # Business logic
│   ├── routes/           # API endpoints
│   └── middleware/       # Auth & validation
│
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # State management
│   │   └── services/     # API calls
│
└── docs/                 # Documentation
```

## Key Features to Explore

### 1. Client Management (Receptionist/Admin)
- Add new clients with factory information
- Search clients by name, phone, or factory
- Edit and delete client records

### 2. Order Management (Designer/Financial/Admin)
- View all orders with client information
- Filter by order status
- Update based on your role:
  - Designer: Change status
  - Financial: Update payments
  - Admin: Full control

### 3. Financial Statistics (Financial/Admin)
- View total revenue, deposits, and remaining amounts
- See order statistics by status
- Track financial performance

### 4. User Management (Admin Only)
- View all system users
- Activate/deactivate users
- Manage user roles

## Common Tasks

### Adding a New Client
1. Login as `receptionist` or `admin`
2. Go to Clients page
3. Click "Add New Client"
4. Fill in the form
5. Click "Create"

### Creating an Order
1. Login as `admin`
2. Go to Orders page
3. Click "Create Order" (to be implemented)
4. Select existing client or create new
5. Fill order details
6. Submit

### Updating Order Status
1. Login as `designer` or `admin`
2. Go to Orders page
3. Use the dropdown to change status
4. Status updates automatically

### Recording a Payment
1. Login as `financial` or `admin`
2. Go to Orders page
3. Click on an order to edit
4. Update deposit amount
5. System calculates remaining automatically

## Testing the System

### Verify Role-Based Access

1. **Test Receptionist Access:**
   - Login as `receptionist`
   - You should ONLY see "Clients" menu
   - Try accessing `/orders` directly - should redirect

2. **Test Designer Access:**
   - Login as `designer`
   - You should ONLY see "Orders" menu
   - You can change order status but not prices

3. **Test Financial Access:**
   - Login as `financial`
   - You should see "Orders" and "Financial Stats"
   - You can change prices but not order status

4. **Test Admin Access:**
   - Login as `admin`
   - You should see ALL menu items
   - Full access to all features

## API Testing

If you want to test the API directly:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get clients (need token from login)
curl http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Backend won't start
- **Error:** MongoDB connection failed
  - **Fix:** Make sure MongoDB is running
  - Check connection string in `backend/.env`

### Frontend won't start
- **Error:** Port 3000 already in use
  - **Fix:** Kill process or use different port
  - `npx kill-port 3000`

### Can't login
- **Error:** Invalid credentials
  - **Fix:** Make sure you ran `npm run seed`
  - Check username/password spelling

### CORS errors
- **Error:** Cross-origin request blocked
  - **Fix:** Check `FRONTEND_URL` in backend `.env`
  - Should match your frontend URL

## Next Steps

### For Developers
1. Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for architecture details
2. Check [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for API reference
3. Review [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for code organization

### For Users
1. Change default passwords immediately
2. Create your actual users (admin can do this)
3. Add your real clients and orders
4. Customize roles and permissions as needed

### For Deployment
1. Review [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) deployment section
2. Set up production database (MongoDB Atlas)
3. Configure environment variables for production
4. Set up HTTPS and security measures

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check the code comments
4. Open an issue on GitHub

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Ready to start?** Follow the Quick Start section above! 🚀
