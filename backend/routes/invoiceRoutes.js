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
const { searchLimiter } = require('../middleware/rateLimiter');

// Protect all routes
router.use(protect);

// Apply search limiter conditionally for GET requests with search parameter
const conditionalSearchLimiter = (req, res, next) => {
  if (req.method === 'GET' && req.query.search && req.query.search.trim() !== '') {
    return searchLimiter(req, res, next);
  }
  next();
};

// Stats route (must be before :id route)
router.get('/stats', authorize('admin'), getInvoiceStats);

// Invoice CRUD routes
router.route('/')
  .get(conditionalSearchLimiter, getInvoices)
  .post(authorize('admin', 'worker', 'designer'), createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(authorize('admin', 'worker', 'designer'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

module.exports = router;
