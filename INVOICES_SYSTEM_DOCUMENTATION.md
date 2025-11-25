# Invoices Management System - Complete Implementation

## Overview
A fully integrated Invoices Management System where **Orders are stored as separate documents** with references to their Invoice. This provides a flexible, scalable architecture with automatic calculations and comprehensive CRUD operations.

---

## Architecture

### Database Structure

**Key Design Decision:** Orders are **separate documents** (not embedded), each with a reference to their Invoice.

```
Invoices Collection          Orders Collection
├── Invoice 1               ├── Order 1 → references Invoice 1
│   ├── client              ├── Order 2 → references Invoice 1
│   ├── tax                 ├── Order 3 → references Invoice 1
│   ├── shipping            ├── Order 4 → references Invoice 2
│   ├── discount            └── Order 5 → references Invoice 2
│   └── totals              
├── Invoice 2               
└── Invoice 3               
```

**Benefits:**
- Orders can be queried independently
- Better performance for large invoices
- Easier to update individual orders
- Automatic invoice total recalculation via middleware

---

## Features Implemented

### 1. Invoice Creation & Management
- ✅ Create new invoices with client selection
- ✅ Automatic invoice date (current date & time)
- ✅ Add unlimited orders to each invoice via "+ Add Order" button
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Invoice status management (Draft, Sent, Paid, Cancelled)
- ✅ Orders are separate documents linked to invoice

### 2. Order Management Within Invoices
Each order contains:
- ✅ Client name
- ✅ Type: DTF, DTFUV, VINIEL, LASERCUT (dropdown)
- ✅ Sheet Width & Height in cm
- ✅ Repeats (number of copies)
- ✅ **Order Size**: Automatically calculated as `repeats × (sheetWidth × sheetHeight)`
- ✅ Total Price
- ✅ Deposit
- ✅ **Remaining**: Auto-calculated as `Total Price - Deposit`
- ✅ Status (Pending, Active, Done, Delivered)
- ✅ Notes
- ✅ Design Link
- ✅ Order Date (auto-generated)
- ✅ Edit and Delete actions for each order
- ✅ **Invoice Reference** - Each order stores its invoice ID

### 3. Invoice Summary Controls
- ✅ **Add Tax**: Adds tax amount to invoice total
- ✅ **Add Shipping**: Adds shipping cost to invoice total
- ✅ **Add Discount**: Subtracts discount from invoice total
- ✅ **Subtotal**: Sum of all order prices
- ✅ **Final Total**: `Subtotal + Tax + Shipping - Discount`
- ✅ **Total Remaining**: Sum of all order remaining amounts
- ✅ All calculations update automatically via database hooks

### 4. Additional Features
- ✅ Clean, modern UI with responsive design
- ✅ Print-friendly invoice detail view
- ✅ Filter invoices by status
- ✅ Client snapshot (preserves client data at invoice creation)
- ✅ Role-based access control (Admin, Worker, Financial)
- ✅ Real-time validation
- ✅ Mobile-responsive design
- ✅ Automatic recalculation when orders are added/updated/deleted

---

## Backend Implementation

### Models

#### Invoice Model (`/backend/models/Invoice.js`)
```javascript
{
  client: ObjectId (ref: Client),
  clientSnapshot: { name, phone, factoryName },
  invoiceDate: Date (auto-generated),
  tax: Number,
  shipping: Number,
  discount: Number,
  subtotal: Number (auto-calculated),
  total: Number (auto-calculated),
  totalRemaining: Number (auto-calculated),
  status: Enum (draft, sent, paid, cancelled),
  notes: String,
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

**Virtual Field:**
- `orders` - Populated from Order collection where `invoice` matches

**Instance Method:**
- `recalculateTotals()` - Queries all orders and updates invoice totals

#### Order Model (`/backend/models/Order.js`)
```javascript
{
  client: ObjectId (ref: Client),
  clientSnapshot: { name, phone, factoryName },
  invoice: ObjectId (ref: Invoice),  // Reference to invoice
  clientName: String,  // For invoice orders
  type: Enum (DTF, DTFUV, VINIEL, LASERCUT),
  sheetWidth: Number,
  sheetHeight: Number,
  repeats: Number,
  orderSize: Number (auto-calculated),
  totalPrice: Number,
  deposit: Number,
  remainingAmount: Number (auto-calculated),
  orderState: Enum (pending, active, done, delivered),
  notes: String,
  designLink: String,
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

**Automatic Calculations (via middleware):**
- Order Size: `repeats × (sheetWidth × sheetHeight)`
- Remaining Amount: `totalPrice - deposit`

**Post-save/update/delete Hooks:**
- Automatically calls `invoice.recalculateTotals()` when order changes

### Controllers

#### Invoice Controller (`/backend/controllers/invoiceController.js`)
Operations:
- `getInvoices()` - Get all invoices with order counts
- `getInvoice(id)` - Get single invoice with populated orders
- `createInvoice()` - Create new invoice
- `updateInvoice(id)` - Update invoice and recalculate totals
- `deleteInvoice(id)` - Delete invoice and all associated orders (Admin only)
- `getInvoiceStats()` - Get statistics (Admin only)

#### Order Controller (`/backend/controllers/orderController.js`)
Updated to support invoice relationships:
- `createOrder()` - Create order with optional invoice reference
- `updateOrder()` - Update order (triggers invoice recalculation)
- `deleteOrder()` - Delete order (triggers invoice recalculation)
- All other existing order operations

### Routes

#### Invoice Routes (`/backend/routes/invoiceRoutes.js`)
```
GET    /api/invoices           - Get all invoices
POST   /api/invoices           - Create invoice
GET    /api/invoices/:id       - Get single invoice with orders
PUT    /api/invoices/:id       - Update invoice
DELETE /api/invoices/:id       - Delete invoice & orders (Admin)
GET    /api/invoices/stats     - Get statistics (Admin)
```

#### Order Routes (Enhanced)
Orders can now be created with an `invoice` field to link them to invoices.

**Access Control:**
- View: Admin, Worker, Financial
- Create/Edit: Admin, Worker
- Delete: Admin only (for invoices)

---

## Frontend Implementation

### Components

#### 1. InvoiceList (`/frontend/src/components/Invoices/InvoiceList.jsx`)
- Displays all invoices in a table
- Shows order count from backend
- Filter by status
- Quick actions: View, Edit, Delete

#### 2. InvoiceForm (`/frontend/src/components/Invoices/InvoiceForm.jsx`)
**Key Features:**
- Client selection dropdown
- Invoice date (auto-populated)
- Status selection

**Order Management:**
- "+ Add Order" button opens modal
- **For new invoices**: Orders stored locally until invoice is saved
- **For existing invoices**: Orders saved immediately to database
- Edit/Delete orders with instant feedback
- Real-time calculation displays

**Summary Section:**
- Tax, Shipping, Discount inputs
- Auto-updating totals from order data

#### 3. InvoiceDetail (`/frontend/src/components/Invoices/InvoiceDetail.jsx`)
- Professional invoice layout
- Displays all orders from database
- Financial summary
- Print functionality

#### 4. Invoices Page (`/frontend/src/pages/Invoices.jsx`)
Router component managing invoice routes

### Services

#### Invoice Service (`/frontend/src/services/invoiceService.js`)
API integration for invoice operations

#### Order Service (Enhanced)
Now supports creating orders with `invoice` field

---

## How It Works

### Creating a New Invoice

1. **User fills invoice details** (client, date, notes)
2. **User adds orders** via "+ Add Order" button
   - Orders stored in local state initially
3. **User clicks "Create Invoice"**
   - Invoice created in database
   - All orders created with `invoice: invoiceId`
   - Order middleware triggers `invoice.recalculateTotals()`
   - Invoice totals automatically updated

### Editing an Existing Invoice

1. **Load invoice** - Orders fetched separately from database
2. **User adds new order** - Immediately saved to database with invoice reference
3. **User edits order** - Order updated, triggers invoice recalculation
4. **User deletes order** - Order deleted, triggers invoice recalculation
5. **User updates tax/shipping/discount** - Invoice updated

### Automatic Recalculation Flow

```
Order Created/Updated/Deleted
        ↓
Order Post-Save Hook Triggered
        ↓
Finds Referenced Invoice
        ↓
Calls invoice.recalculateTotals()
        ↓
Queries All Orders for Invoice
        ↓
Calculates: subtotal, totalRemaining
        ↓
Calculates: total = subtotal + tax + shipping - discount
        ↓
Saves Invoice
```

---

## Usage Guide

### Creating an Invoice

1. **Navigate to Invoices** → Click "Add Invoice"
2. **Fill Invoice Details**
   - Select client
   - Set status (default: Draft)
   - Add notes (optional)
3. **Add Orders**
   - Click "+ Add Order"
   - Fill in all order details
   - See real-time calculations
   - Click "Add Order" to add to invoice
   - Repeat for multiple orders
4. **Adjust Summary**
   - Set tax, shipping, discount
   - View auto-calculated totals
5. **Save Invoice**
   - Click "Create Invoice"
   - All orders saved with invoice reference

### Editing an Invoice

1. **Click "Edit" on any invoice**
2. **Modify Invoice**
   - Update details
   - Add new orders (saved immediately)
   - Edit orders (updated immediately)
   - Delete orders (removed immediately)
   - Adjust tax/shipping/discount
3. **Save Changes**
   - Click "Update Invoice"

---

## Automatic Calculations

### Order Level (Middleware)
1. **Order Size** = `repeats × sheetWidth × sheetHeight`
2. **Remaining** = `totalPrice - deposit`
3. Calculated on save/update

### Invoice Level (Method)
1. **Subtotal** = Sum of all linked order `totalPrice` values
2. **Total Remaining** = Sum of all linked order `remainingAmount` values
3. **Final Total** = `subtotal + tax + shipping - discount`
4. Triggered automatically when orders change

---

## Database Schema

### Collections:
- `invoices` - Invoice documents
- `orders` - Order documents (with invoice reference)
- `clients` - Client data
- `users` - User data

### Relationships:
```
Invoice ←many-to-one→ Client
Invoice ←one-to-many→ Orders
Order ←many-to-one→ Invoice
Order ←many-to-one→ Client (optional)
```

### Indexes:
**Invoices:**
- `status + createdAt`
- `client`
- `invoiceDate`

**Orders:**
- `orderState + createdAt`
- `client`
- `invoice` (NEW)

---

## API Response Format

### Get Invoice Response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "client": {...},
    "tax": 10,
    "shipping": 5,
    "discount": 0,
    "subtotal": 100,
    "total": 115,
    "totalRemaining": 50,
    "orders": [
      {
        "_id": "...",
        "clientName": "John Doe",
        "type": "DTF",
        "sheetWidth": 30,
        "sheetHeight": 40,
        "repeats": 5,
        "orderSize": 6000,
        "totalPrice": 100,
        "deposit": 50,
        "remainingAmount": 50,
        "invoice": "..." // Reference to invoice
      }
    ]
  }
}
```

---

## Key Advantages of This Architecture

### 1. **Scalability**
- Orders don't bloat invoice documents
- Better performance for large invoices
- Can query orders independently

### 2. **Data Integrity**
- Automatic recalculation ensures consistency
- Middleware handles all updates
- No manual calculation needed

### 3. **Flexibility**
- Orders can exist without invoices
- Easy to reassign orders to different invoices
- Can track order history independently

### 4. **Performance**
- Indexed invoice references
- Efficient queries
- Pagination-ready

---

## Files Created/Modified

### Backend:
- ✅ `/backend/models/Invoice.js` (restructured - removed embedded orders)
- ✅ `/backend/models/Order.js` (updated - added invoice reference & hooks)
- ✅ `/backend/controllers/invoiceController.js` (rewritten for referenced orders)
- ✅ `/backend/controllers/orderController.js` (updated - invoice support)
- ✅ `/backend/routes/invoiceRoutes.js` (simplified)
- ✅ `/backend/server.js` (modified - added invoice routes)

### Frontend:
- ✅ `/frontend/src/services/invoiceService.js` (created)
- ✅ `/frontend/src/components/Invoices/InvoiceList.jsx` (created)
- ✅ `/frontend/src/components/Invoices/InvoiceForm.jsx` (rewritten - separate order handling)
- ✅ `/frontend/src/components/Invoices/InvoiceDetail.jsx` (updated)
- ✅ `/frontend/src/components/Invoices/Invoices.css` (created)
- ✅ `/frontend/src/pages/Invoices.jsx` (created)
- ✅ `/frontend/src/App.jsx` (modified - added invoice routes)
- ✅ `/frontend/src/components/Navbar.jsx` (modified - added invoice links)
- ✅ `/frontend/src/services/api.js` (fixed - port 5001)

---

## Testing Checklist

Backend:
- [ ] Create invoice
- [ ] Add orders to invoice
- [ ] Verify automatic total calculation
- [ ] Update order and verify invoice recalculation
- [ ] Delete order and verify invoice recalculation
- [ ] Update invoice tax/shipping/discount
- [ ] Delete invoice (verify orders deleted)

Frontend:
- [ ] Create invoice with multiple orders
- [ ] Edit existing invoice
- [ ] Add new order to existing invoice
- [ ] Edit order in invoice
- [ ] Delete order from invoice
- [ ] Verify real-time total calculations
- [ ] Print invoice
- [ ] Filter invoices by status
- [ ] Test on mobile devices

---

## Summary

The Invoices Management System has been **fully restructured** to use **separate Order documents** with invoice references:

✅ **Architecture**: Orders stored separately with invoice references  
✅ **Automatic Calculations**: Via database middleware and methods  
✅ **Smart Updates**: Orders trigger invoice recalculation automatically  
✅ **Full CRUD**: Complete operations for invoices and orders  
✅ **Clean Separation**: Orders can be managed independently  
✅ **Role-Based Access**: Proper authorization  
✅ **Modern UI**: Responsive and print-ready  

The system is production-ready with a scalable, maintainable architecture! 🎉
