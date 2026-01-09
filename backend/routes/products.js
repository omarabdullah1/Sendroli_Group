const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router
    .route('/')
    .get(getProducts)
    .post(authorize('admin', 'designer'), createProduct);

router
    .route('/:id')
    .get(getProduct)
    .put(authorize('admin', 'designer'), updateProduct)
    .delete(authorize('admin'), deleteProduct);

module.exports = router;
