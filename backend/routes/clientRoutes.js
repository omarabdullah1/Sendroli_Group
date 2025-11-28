const express = require('express');
const router = express.Router();
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientReport,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Apply search limiter conditionally for GET requests with search parameter
const conditionalSearchLimiter = (req, res, next) => {
  if (req.method === 'GET' && req.query.search && req.query.search.trim() !== '') {
    return searchLimiter(req, res, next);
  }
  next();
};

// Routes accessible by different roles
router
  .route('/')
  .get(conditionalSearchLimiter, authorize('receptionist', 'designer', 'financial', 'admin'), getClients) // All roles can view clients list for orders
  .post(authorize('receptionist', 'admin'), createClient); // Only receptionist and admin can create

// Client report route (must be before /:id route to avoid conflict)
router.get('/:id/report', authorize('admin', 'financial', 'receptionist'), getClientReport);

router
  .route('/:id')
  .get(getClient) // All authenticated users can view client details
  .put(authorize('receptionist', 'admin'), updateClient)
  .delete(authorize('receptionist', 'admin'), deleteClient);

module.exports = router;
