const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const upload = require('../middleware/upload');

// --- BRANDS ---
router.get('/brands', storeController.getBrands);
router.post('/brands', storeController.createBrand);

// --- MODELS ---
router.get('/models', storeController.getModels);
router.post('/models', storeController.createModel);

// --- CATEGORIES ---
router.get('/categories', storeController.getCategories);
router.post('/categories', storeController.createCategory);

// --- PRODUCTS ---
router.get('/products', storeController.getProducts);
router.post('/products', upload.single('image'), storeController.createProduct);
router.get('/products/:id', storeController.getProductById);

// --- CUSTOM DESIGN UPLOAD ---
router.post('/custom-upload', upload.single('image'), storeController.uploadCustomDesign);

// --- ORDERS ---
router.post('/orders', storeController.createOrder); // Public (Checkout)
router.get('/orders', storeController.getOrders); // Admin (Dashboard)
router.put('/orders/:id/status', storeController.updateOrderStatus); // Admin (Dashboard)

module.exports = router;
