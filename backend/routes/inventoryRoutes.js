const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// All routes require authentication and admin access
router.use(protect);
router.use(authorize('admin'));

// Daily inventory routes
router.route('/daily/:date?')
  .get(inventoryController.getDailyInventory);

router.route('/daily')
  .post(inventoryController.submitDailyCount);

// Material inventory history
router.route('/:materialId/history')
  .get(inventoryController.getInventoryHistory);

// Wastage routes
router.route('/wastage')
  .get(inventoryController.getWastageReport)
  .post(inventoryController.recordWastage);

module.exports = router;