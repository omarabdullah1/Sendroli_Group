# Factory Management System - Usage Guide

## Getting Started

### First Time Setup

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Start the Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npm run dev
   ```

4. **Open the Application**
   - Navigate to: `http://localhost:5173`

## User Roles & Permissions

### Admin
- **Full Access**: Can manage all users, clients, and orders
- **Special Permissions**: 
  - Create/edit/delete users
  - Delete clients
  - Access all features

### Financial
- **Access**: Orders and clients with financial data
- **Special Permissions**:
  - Delete orders
  - View all financial information

### Designer
- **Access**: Orders and clients
- **Permissions**: Create and edit orders, view client information

### Receptionist
- **Basic Access**: View and create clients and orders
- **Limitations**: Cannot delete resources

## Features Overview

### 1. Dashboard
- View total orders and clients
- See revenue statistics
- Quick access to create new clients/orders
- Status breakdown of all orders

### 2. Client Management

#### Add New Client
1. Click "Clients" in navigation
2. Click "Add New Client"
3. Fill in required fields:
   - Name *
   - Phone *
   - Factory Name *
   - Address (optional)
   - Notes (optional)
4. Click "Create Client"

#### Edit Client
1. Go to Clients list
2. Click "Edit" on desired client
3. Update information
4. Click "Update Client"

#### View Client Details
1. Click "View" on any client
2. See all client information
3. View associated orders

### 3. Order Management

#### Create New Order
1. Click "Orders" in navigation
2. Click "Create New Order"
3. Fill in required fields:
   - Select Client *
   - Type * (e.g., "T-Shirt", "Dress")
   - Size * (e.g., "Large", "XL")
   - Repeats * (quantity)
   - Price *
   - Deposit *
   - Status (pending/active/done/delivered)
   - Delivery Date (optional)
   - Description (optional)
4. Click "Create Order"

**Note**: Balance is automatically calculated as Price - Deposit

#### Update Order Status
1. Find order in Orders list
2. Click "Edit"
3. Change status:
   - **Pending**: Order received, not started
   - **Active**: Work in progress
   - **Done**: Completed, awaiting delivery
   - **Delivered**: Delivered to client
4. Click "Update Order"

#### Filter Orders
- Use the status dropdown on Orders page
- Filter by: All, Pending, Active, Done, Delivered

### 4. User Management (Admin Only)

#### Create New User
1. Go to Users page (Admin only)
2. Click "Add User"
3. Enter user details
4. Assign role
5. Click "Create User"

## Common Workflows

### Workflow 1: New Client Order
1. Add client (if new)
2. Create order for client
3. Set status to "pending"
4. Update status as work progresses
5. Mark as "delivered" when complete

### Workflow 2: Track Order Progress
1. Go to Dashboard
2. Check status breakdown
3. Click on Orders
4. Filter by status
5. Update individual orders

### Workflow 3: Financial Tracking
1. View Dashboard for total revenue
2. Check Orders for payment status
3. Filter by "delivered" to see completed orders
4. Monitor balance column for pending payments

## Tips & Best Practices

### For Receptionists
- Always verify client phone numbers
- Keep factory names consistent
- Add notes for special requests

### For Designers
- Update order status regularly
- Add descriptions for custom work
- Set realistic delivery dates

### For Financial Team
- Monitor balances regularly
- Follow up on pending payments
- Keep deposit records accurate

### For Admins
- Review user access regularly
- Monitor system usage
- Back up data regularly

## Troubleshooting

### Cannot Login
- Check email and password
- Ensure account is active
- Contact admin to reset password

### Cannot See Certain Features
- Verify your user role
- Some features are role-restricted
- Contact admin for access

### Orders Not Showing
- Check filters (might be filtered by status)
- Refresh the page
- Ensure you have permission to view orders

### Client Already Exists Error
- Client with same name might exist
- Use different name or check existing clients
- Edit existing client instead

## API Testing (Developers)

### Using curl

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Get Clients** (with token):
```bash
curl http://localhost:5000/api/auth/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Support

For issues or questions:
1. Check this guide
2. Review the README.md
3. Check SECURITY.md for security-related questions
4. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-13
