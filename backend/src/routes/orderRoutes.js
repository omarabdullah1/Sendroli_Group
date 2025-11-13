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
const { orderValidation, idValidation } = require('../middleware/validation');

router.get('/stats', protect, getOrderStats);
router.get('/', protect, getOrders);
router.get('/:id', protect, idValidation, getOrderById);
router.post('/', protect, orderValidation, createOrder);
router.put('/:id', protect, idValidation, orderValidation, updateOrder);
router.delete('/:id', protect, authorize('Admin', 'Financial'), idValidation, deleteOrder);

module.exports = router;
