const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

// All routes require authentication and admin access
router.use(protect);
router.use(authorize('admin'));

// Main supplier routes
router.route('/')
  .get(supplierController.getAllSuppliers)
  .post(supplierController.createSupplier);

// Individual supplier routes
router.route('/:id')
  .get(supplierController.getSupplier)
  .put(supplierController.updateSupplier)
  .delete(supplierController.deleteSupplier);

module.exports = router;