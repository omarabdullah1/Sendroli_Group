const express = require('express');
const router = express.Router();
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes accessible by different roles
router
  .route('/')
  .get(authorize('receptionist', 'designer', 'financial', 'admin'), getClients) // All roles can view clients list for orders
  .post(authorize('receptionist', 'admin'), createClient); // Only receptionist and admin can create

router
  .route('/:id')
  .get(getClient) // All authenticated users can view client details
  .put(authorize('receptionist', 'admin'), updateClient)
  .delete(authorize('receptionist', 'admin'), deleteClient);

module.exports = router;
