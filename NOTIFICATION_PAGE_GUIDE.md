# 🔔 Notification System - Complete Implementation Guide

## 📋 Overview

This guide covers the complete notification system implementation with both **real-time toast notifications** and **persistent notification history** integrated with the backend API.

## 🏗️ System Architecture

### Frontend Components

1. **NotificationContext** - Global state for toast notifications
2. **NotificationContainer** - Toast display component
3. **Notifications Page** - Persistent notification history
4. **TopHeader** - Bell icon with unread count
5. **Sidebar** - Navigation menu item

### Backend Components

1. **Notification Model** - MongoDB schema
2. **Notification Controller** - API endpoints
3. **Notification Routes** - Express routes
4. **Notification Service** - Frontend API client

## ✅ Implementation Checklist

### Backend (✅ Completed)

- [x] **Notification Model** (`/backend/models/Notification.js`)
  - Fields: user, title, message, type, relatedId, relatedType, read, readAt, actionUrl
  - Types: order, invoice, payment, inventory, system, client
  - Indexes on user and read fields

- [x] **Notification Controller** (`/backend/controllers/notificationController.js`)
  - `getNotifications` - Get paginated notifications with filters
  - `getUnreadCount` - Get count of unread notifications
  - `markAsRead` - Mark single notification as read
  - `markAllAsRead` - Mark all notifications as read
  - `deleteNotification` - Delete single notification
  - `deleteAllRead` - Delete all read notifications
  - `createNotification` - Helper function for creating notifications

- [x] **Notification Routes** (`/backend/routes/notificationRoutes.js`)

  ```
  GET    /api/notifications              - Get notifications (with filters)
  GET    /api/notifications/unread-count - Get unread count
  PUT    /api/notifications/mark-all-read - Mark all as read
  PUT    /api/notifications/:id/read     - Mark single as read
  DELETE /api/notifications/read         - Delete all read
  DELETE /api/notifications/:id          - Delete single notification
  ```

- [x] **Server Registration** (`/backend/server.js`)
  - Route: `app.use('/api/notifications', notificationRoutes)`

### Frontend (✅ Completed)

- [x] **Notification Service** (`/frontend/src/services/notificationService.js`)
  - API client for all notification endpoints
  - Methods: getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllRead

- [x] **Notifications Page** (`/frontend/src/pages/Notifications.jsx`)
  - Full notification history with pagination
  - Filters: all/unread/read, by category
  - Actions: mark as read, delete, mark all read, delete all read
  - Real-time unread count
  - Empty states

- [x] **Notifications Styles** (`/frontend/src/pages/Notifications.css`)
  - Responsive design
  - Category color coding
  - Hover effects
  - Animations

- [x] **App Routing** (`/frontend/src/App.jsx`)
  - Route: `/notifications`
  - Protected route for all authenticated users
  - Added to Layout ERP pages check

- [x] **Sidebar Menu** (`/frontend/src/components/Sidebar/Sidebar.jsx`)
  - Added "Notifications" menu item to baseItems
  - Icon: 🔔
  - Available to all roles

- [x] **TopHeader Integration** (`/frontend/src/components/TopHeader/TopHeader.jsx`)
  - Bell icon with unread count badge
  - Notification dropdown preview
  - "View All Notifications" button → `/notifications`
  - Auto-refresh every 30 seconds

## 📱 User Interface

### Toast Notifications (Already Implemented)

- Position: Top-right corner
- Types: success, error, warning, info
- Auto-dismiss: 5 seconds
- Click to dismiss
- Slide-in animation

### Notifications Page (NEW)

```
┌─────────────────────────────────────────────────┐
│ 🔔 Notifications          [5 unread]           │
│ [✓ Mark all as read]  [🗑️ Delete read]        │
├─────────────────────────────────────────────────┤
│ Status: [All ▼]  Category: [All Categories ▼]  │
│ Showing 10 of 50 notifications                  │
├─────────────────────────────────────────────────┤
│ ● 📋 Order #1234 Status Updated                │
│   Order has been moved to 'active' status      │
│   order • 2h ago                      [✓] [🗑️] │
├─────────────────────────────────────────────────┤
│   💰 Payment Received                           │
│   Client payment of $500 has been processed    │
│   payment • 1d ago                    [✓] [🗑️] │
├─────────────────────────────────────────────────┤
│                 [1] [2] [3] [4] [5]            │
└─────────────────────────────────────────────────┘
```

### TopHeader Bell Icon

```
┌────────────┐
│   🔔 (5)   │  ← Unread badge
└────────────┘
      ↓
┌─────────────────────────────────────┐
│ Notifications    [Mark all as read] │
├─────────────────────────────────────┤
│ ● Order #1234 Updated  (2h ago)    │
│ ● Payment Received     (1d ago)     │
│   Invoice Created      (2d ago)     │
├─────────────────────────────────────┤
│     [View All Notifications]        │
└─────────────────────────────────────┘
```

## 🔧 Usage Guide

### For Users

1. **View Notifications**
   - Click bell icon in TopHeader (shows preview)
   - Click "Notifications" in sidebar (full history)
   - Click "View All Notifications" in dropdown

2. **Manage Notifications**
   - Click notification to mark as read
   - Click 🗑️ to delete single notification
   - Click "Mark all as read" for bulk action
   - Click "Delete read" to clean up

3. **Filter Notifications**
   - Status: All / Unread / Read
   - Category: All / Orders / Invoices / Payments / etc.

### For Developers

#### Creating Notifications from Backend

```javascript
// In any controller (e.g., orderController.js)
const { createNotification } = require('./notificationController');

// Create notification
await createNotification(userId, {
  title: 'Order Created',
  message: `New order #${order.orderNumber} has been created`,
  type: 'order',
  relatedId: order._id,
  relatedType: 'Order',
  actionUrl: `/orders/${order._id}`,
});
```

#### Using Toast Notifications (Frontend)

```javascript
import { useNotification } from '../context/NotificationContext';

const MyComponent = () => {
  const { success, error, warning, info } = useNotification();

  const handleAction = async () => {
    try {
      // Perform action
      success('Action completed successfully!');
    } catch (err) {
      error('Action failed. Please try again.');
    }
  };
};
```

#### Getting Role-Based Messages

```javascript
import { getNotificationMessage } from '../utils/notificationMessages';

// Get role-appropriate message
const message = getNotificationMessage(
  'orders',        // category
  'created',       // action
  user.role,       // role
  { orderNumber: '1234', clientName: 'ABC Corp' }  // params
);
```

## 🎯 Next Steps: Backend Integration

To complete the notification system, you need to integrate notification creation into all action endpoints:

### 1. Client Actions (`/backend/controllers/clientController.js`)

```javascript
const { createNotification } = require('./notificationController');

// In createClient
await createNotification(req.user.id, {
  title: 'Client Created',
  message: `New client "${client.name}" has been added`,
  type: 'client',
  relatedId: client._id,
  relatedType: 'Client',
  actionUrl: `/clients/${client._id}`,
});

// In updateClient
await createNotification(req.user.id, {
  title: 'Client Updated',
  message: `Client "${client.name}" has been updated`,
  type: 'client',
  relatedId: client._id,
  relatedType: 'Client',
});

// In deleteClient
await createNotification(req.user.id, {
  title: 'Client Deleted',
  message: `Client "${client.name}" has been removed`,
  type: 'client',
});
```

### 2. Order Actions (`/backend/controllers/orderController.js`)

```javascript
// In createOrder
await createNotification(req.user.id, {
  title: 'Order Created',
  message: `New order #${order.orderNumber} for ${client.name}`,
  type: 'order',
  relatedId: order._id,
  relatedType: 'Order',
  actionUrl: `/orders/${order._id}`,
});

// In updateOrder (status change)
await createNotification(req.user.id, {
  title: 'Order Status Updated',
  message: `Order #${order.orderNumber} status changed to "${order.orderState}"`,
  type: 'order',
  relatedId: order._id,
  relatedType: 'Order',
  actionUrl: `/orders/${order._id}`,
});
```

### 3. Invoice Actions (`/backend/controllers/invoiceController.js`)

```javascript
// In createInvoice
await createNotification(req.user.id, {
  title: 'Invoice Created',
  message: `Invoice #${invoice.invoiceNumber} generated`,
  type: 'invoice',
  relatedId: invoice._id,
  relatedType: 'Invoice',
  actionUrl: `/invoices/${invoice._id}`,
});

// In recordPayment
await createNotification(req.user.id, {
  title: 'Payment Received',
  message: `Payment of $${payment.amount} received for invoice #${invoice.invoiceNumber}`,
  type: 'payment',
  relatedId: invoice._id,
  relatedType: 'Invoice',
});
```

### 4. Material Actions (`/backend/controllers/materialController.js`)

```javascript
// In createMaterial
await createNotification(req.user.id, {
  title: 'Material Added',
  message: `New material "${material.name}" added to inventory`,
  type: 'inventory',
  relatedId: material._id,
  relatedType: 'Material',
});

// In updateStock
await createNotification(req.user.id, {
  title: 'Stock Updated',
  message: `Stock level updated for ${material.name}`,
  type: 'inventory',
  relatedId: material._id,
  relatedType: 'Material',
});
```

### 5. User Actions (`/backend/controllers/userController.js`)

```javascript
// In createUser
await createNotification(req.user.id, {
  title: 'User Created',
  message: `New user "${user.username}" has been registered`,
  type: 'system',
  relatedId: user._id,
  relatedType: 'User',
});

// In updateUser
await createNotification(req.user.id, {
  title: 'User Updated',
  message: `User "${user.username}" profile has been updated`,
  type: 'system',
  relatedId: user._id,
  relatedType: 'User',
});
```

## 🔄 Real-Time Updates (Optional Enhancement)

For real-time notification updates, you can implement:

### Option 1: Polling (Simple)

```javascript
// Already implemented in TopHeader.jsx
useEffect(() => {
  const interval = setInterval(fetchNotifications, 30000); // 30 seconds
  return () => clearInterval(interval);
}, []);
```

### Option 2: WebSocket (Advanced)

```javascript
// Backend: socket.io
io.on('connection', (socket) => {
  socket.on('subscribe-notifications', (userId) => {
    socket.join(`user-${userId}`);
  });
});

// Emit when notification created
io.to(`user-${userId}`).emit('new-notification', notification);

// Frontend: socket.io-client
const socket = io(API_URL);
socket.emit('subscribe-notifications', user.id);
socket.on('new-notification', (notification) => {
  setNotifications(prev => [notification, ...prev]);
  setUnreadCount(prev => prev + 1);
});
```

## 📊 Notification Categories & Types

```javascript
const NOTIFICATION_TYPES = {
  ORDER: 'order',           // 📋 Blue
  INVOICE: 'invoice',       // 💰 Green
  PAYMENT: 'payment',       // 💳 Orange
  INVENTORY: 'inventory',   // 📦 Purple
  CLIENT: 'client',         // 👤 Pink
  SYSTEM: 'system',         // ⚙️ Gray
};
```

## 🎨 Customization

### Add New Notification Type

1. **Update Backend Model** (if needed)

```javascript
// backend/models/Notification.js
type: {
  enum: ['order', 'invoice', 'payment', 'inventory', 'system', 'client', 'your-new-type'],
}
```

2. **Add Icon & Color** (frontend)

```javascript
// pages/Notifications.jsx
const getNotificationIcon = (type) => {
  const icons = {
    // ...existing
    'your-new-type': '🆕',
  };
};

const getTypeColor = (type) => {
  const colors = {
    // ...existing
    'your-new-type': '#ff6b6b',
  };
};
```

3. **Add Messages** (frontend)

```javascript
// utils/notificationMessages.js
notificationMessages.yourcategory = {
  created: {
    admin: (params) => `New ${params.name} created`,
    // ...other roles
  },
};
```

## 🚀 Testing

### Test Notification Creation

```bash
# Create test notification via API
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "system"
  }'
```

### Test Checklist

- [ ] Create notification via backend action
- [ ] Toast notification appears on frontend
- [ ] Notification appears in bell dropdown
- [ ] Notification appears in notifications page
- [ ] Unread count updates
- [ ] Mark as read works
- [ ] Delete works
- [ ] Filters work (all/unread/read)
- [ ] Category filters work
- [ ] Pagination works
- [ ] Mark all as read works
- [ ] Delete all read works

## 📚 File Structure

```
backend/
├── models/
│   └── Notification.js               ✅ Notification schema
├── controllers/
│   └── notificationController.js     ✅ API controllers
└── routes/
    └── notificationRoutes.js         ✅ Express routes

frontend/
├── src/
│   ├── context/
│   │   └── NotificationContext.jsx   ✅ Toast state
│   ├── components/
│   │   ├── NotificationContainer.jsx ✅ Toast display
│   │   ├── NotificationContainer.css ✅ Toast styles
│   │   ├── Sidebar/
│   │   │   └── Sidebar.jsx          ✅ Menu item
│   │   └── TopHeader/
│   │       └── TopHeader.jsx        ✅ Bell icon + dropdown
│   ├── pages/
│   │   ├── Notifications.jsx         ✅ History page
│   │   └── Notifications.css         ✅ Page styles
│   ├── services/
│   │   └── notificationService.js    ✅ API client
│   ├── utils/
│   │   └── notificationMessages.js   ✅ Message templates
│   └── App.jsx                       ✅ Routing
```

## 🎯 Summary

### ✅ Completed

- Full notification UI system (toast + history page)
- Backend API endpoints for all operations
- Frontend service layer for API calls
- Role-based message templates
- Responsive design
- Filter and pagination
- Unread count tracking
- Sidebar menu integration
- TopHeader bell icon with dropdown

### 🔄 Integration Needed

- Add `createNotification()` calls to all backend action endpoints
- Test complete flow from action → notification → display

### 🚀 Optional Enhancements

- WebSocket for real-time updates (currently polling)
- Email notifications
- Push notifications (PWA)
- Notification preferences per user
- Notification templates per role
- Bulk actions (select multiple)

## 📞 Support

For issues or questions:

1. Check notification console logs
2. Verify backend routes are registered
3. Check network tab for API calls
4. Verify user authentication
5. Check notification service error handling

---

**Last Updated:** 2024
**Status:** ✅ Ready for Integration
**Next Step:** Integrate notification creation into backend action endpoints
