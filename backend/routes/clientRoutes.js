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

// Routes accessible by receptionist and admin
router
  .route('/')
  .get(authorize('receptionist', 'admin'), getClients)
  .post(authorize('receptionist', 'admin'), createClient);

router
  .route('/:id')
  .get(getClient) // All authenticated users can view client details
  .put(authorize('receptionist', 'admin'), updateClient)
  .delete(authorize('receptionist', 'admin'), deleteClient);

module.exports = router;
