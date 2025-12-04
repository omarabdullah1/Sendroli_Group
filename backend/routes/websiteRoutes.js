const express = require('express');
const router = express.Router();
const {
  getWebsiteSettings,
  updateWebsiteSettings,
  addService,
  updateService,
  deleteService,
  addGalleryItem,
  deleteGalleryItem,
} = require('../controllers/websiteController');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Public routes
router.get('/settings', getWebsiteSettings);

// Protected routes (Admin only)
router.put('/settings', protect, authorize('admin'), updateWebsiteSettings);
router.post('/services', protect, authorize('admin'), addService);
router.put('/services/:id', protect, authorize('admin'), updateService);
router.delete('/services/:id', protect, authorize('admin'), deleteService);
router.post('/gallery', protect, authorize('admin'), addGalleryItem);
router.delete('/gallery/:id', protect, authorize('admin'), deleteGalleryItem);

// Upload routes
router.post('/upload', protect, authorize('admin'), upload.single('image'), uploadImage);
router.delete('/upload/:filename', protect, authorize('admin'), deleteImage);

module.exports = router;

