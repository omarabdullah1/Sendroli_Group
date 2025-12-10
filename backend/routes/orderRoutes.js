const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getFinancialStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Apply search limiter conditionally for GET requests with search parameter
const conditionalSearchLimiter = (req, res, next) => {
  if (req.method === 'GET' && req.query.search && req.query.search.trim() !== '') {
    return searchLimiter(req, res, next);
  }
  next();
};

// Financial statistics route
router.get('/stats/financial', authorize('financial', 'admin'), getFinancialStats);

// Main order routes
router
  .route('/')
  .get(conditionalSearchLimiter, authorize('designer', 'worker', 'financial', 'admin', 'client'), getOrders)
  .post(authorize('admin', 'designer'), createOrder); // Allow designers to create orders (for invoices)

router
  .route('/:id')
  .get(authorize('designer', 'worker', 'financial', 'admin', 'client'), getOrder)
  .put(authorize('designer', 'worker', 'financial', 'admin'), updateOrder)
  .delete(authorize('admin'), deleteOrder);

module.exports = router;
