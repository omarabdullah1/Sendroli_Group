const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, getOrderStats);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, authorize('Admin', 'Financial'), deleteOrder);

module.exports = router;
