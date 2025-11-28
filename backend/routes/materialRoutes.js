const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const materialController = require('../controllers/materialController');

// All routes require authentication
router.use(protect);

// Main material routes
router.route('/')
  .get(authorize('admin', 'designer', 'worker'), materialController.getAllMaterials) // Allow designers and workers to read materials for invoices/orders
  .post(authorize('admin'), materialController.createMaterial); // Only admin can create

// Low stock materials
router.route('/low-stock')
  .get(authorize('admin'), materialController.getLowStockMaterials);

// Stock update
router.route('/stock/update')
  .post(authorize('admin'), materialController.updateStock);

// Individual material routes
router.route('/:id')
  .get(authorize('admin', 'designer', 'worker'), materialController.getMaterial) // Allow designers and workers to read individual materials
  .put(authorize('admin'), materialController.updateMaterial) // Only admin can update
  .delete(authorize('admin'), materialController.deleteMaterial); // Only admin can delete

module.exports = router;