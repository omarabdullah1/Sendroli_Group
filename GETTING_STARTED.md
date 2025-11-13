# Getting Started with Factory Management System

Welcome! This guide will help you get the Factory Management System up and running quickly.

## Quick Start (5 minutes)

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
