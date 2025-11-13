const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  updateUser,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Admin'), getUsers);
router.put('/users/:id', protect, authorize('Admin'), updateUser);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
