const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const materialController = require('../controllers/materialController');

// All routes require authentication and admin access
router.use(protect);
router.use(authorize('admin'));

// Main material routes
router.route('/')
  .get(materialController.getAllMaterials)
  .post(materialController.createMaterial);

// Low stock materials
router.route('/low-stock')
  .get(materialController.getLowStockMaterials);

// Stock update
router.route('/stock/update')
  .post(materialController.updateStock);

// Individual material routes
router.route('/:id')
  .get(materialController.getMaterial)
  .put(materialController.updateMaterial)
  .delete(materialController.deleteMaterial);

module.exports = router;