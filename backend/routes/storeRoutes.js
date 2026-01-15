const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const upload = require('../middleware/upload');

// --- BRANDS ---
router.get('/brands', storeController.getBrands);
router.post('/brands', upload.single('logo'), storeController.createBrand);
router.put('/brands/:id', upload.single('logo'), storeController.updateBrand);
router.delete('/brands/:id', storeController.deleteBrand);

// --- MODELS ---
router.get('/models', storeController.getModels);
router.post('/models', storeController.createModel);
router.put('/models/:id', storeController.updateModel);
router.delete('/models/:id', storeController.deleteModel);

// --- CATEGORIES ---
router.get('/categories', storeController.getCategories);
router.post('/categories', storeController.createCategory);
router.put('/categories/:id', storeController.updateCategory);
router.delete('/categories/:id', storeController.deleteCategory);

// --- SHIPPING ---
router.get('/shipping', storeController.getShipping);
router.post('/shipping', storeController.createShipping);
router.put('/shipping/:id', storeController.updateShipping);
router.delete('/shipping/:id', storeController.deleteShipping);

// --- CUSTOMERS ---
router.get('/customers', storeController.getStoreCustomers);

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

