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
  .get(authorize('designer', 'financial', 'admin'), getOrders)
  .post(authorize('admin'), createOrder);

router
  .route('/:id')
  .get(authorize('designer', 'financial', 'admin'), getOrder)
  .put(authorize('designer', 'financial', 'admin'), updateOrder)
  .delete(authorize('admin'), deleteOrder);

module.exports = router;
