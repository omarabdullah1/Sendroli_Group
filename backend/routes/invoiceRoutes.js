const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
} = require('../controllers/invoiceController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Stats route (must be before :id route)
router.get('/stats', authorize('admin'), getInvoiceStats);

// Invoice CRUD routes
router.route('/')
  .get(getInvoices)
  .post(authorize('admin', 'worker', 'designer'), createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(authorize('admin', 'worker', 'designer'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

module.exports = router;
