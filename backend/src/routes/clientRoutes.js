const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');
const { clientValidation, idValidation } = require('../middleware/validation');

router.get('/', protect, getClients);
router.get('/:id', protect, idValidation, getClientById);
router.post('/', protect, clientValidation, createClient);
router.put('/:id', protect, idValidation, clientValidation, updateClient);
router.delete('/:id', protect, authorize('Admin'), idValidation, deleteClient);

module.exports = router;
