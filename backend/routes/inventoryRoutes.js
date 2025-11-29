const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// All routes require authentication
router.use(protect);

// Daily inventory routes - allow workers to submit counts
router.route('/daily/:date?')
  .get(authorize('admin', 'worker'), inventoryController.getDailyInventory);

router.route('/daily')
  .post(authorize('admin', 'worker'), inventoryController.submitDailyCount);

// Wastage routes - admin only (must come before parameterized routes)
router.route('/wastage')
  .get(authorize('admin'), inventoryController.getWastageReport)
  .post(authorize('admin'), inventoryController.recordWastage);

// Withdrawal routes - allow workers to withdraw materials (must come before parameterized routes)
router.post('/withdraw', authorize('admin', 'worker'), inventoryController.withdrawMaterial);

router.get('/withdrawals', authorize('admin', 'worker'), inventoryController.getWithdrawals);

// Material inventory history - admin only (parameterized route must come last)
router.route('/:materialId/history')
  .get(authorize('admin'), inventoryController.getInventoryHistory);

module.exports = router;