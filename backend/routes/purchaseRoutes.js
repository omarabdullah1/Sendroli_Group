const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const purchaseController = require('../controllers/purchaseController');

// All routes require authentication and admin access
router.use(protect);
router.use(authorize('admin'));

// Main purchase routes
router.route('/')
  .get(purchaseController.getAllPurchases)
  .post(purchaseController.createPurchase);

// Receive purchase
router.route('/:id/receive')
  .post(purchaseController.receivePurchase);

// Individual purchase routes
router.route('/:id')
  .get(purchaseController.getPurchase)
  .put(purchaseController.updatePurchase)
  .delete(purchaseController.deletePurchase);

module.exports = router;