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

// All routes require authentication
router.use(protect);

// Financial statistics route
router.get('/stats/financial', authorize('financial', 'admin'), getFinancialStats);

// Main order routes
router
  .route('/')
  .get(authorize('designer', 'worker', 'financial', 'admin'), getOrders)
  .post(authorize('admin'), createOrder);

router
  .route('/:id')
  .get(authorize('designer', 'worker', 'financial', 'admin'), getOrder)
  .put(authorize('designer', 'worker', 'financial', 'admin'), updateOrder)
  .delete(authorize('admin'), deleteOrder);

module.exports = router;
