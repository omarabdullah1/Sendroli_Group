const CovBrand = require('../models/store/CovBrand');
const CovModel = require('../models/store/CovModel');
const CovCategory = require('../models/store/CovCategory');
const CovProduct = require('../models/store/CovProduct');
const CovOrder = require('../models/store/CovOrder');

// --- BRANDS ---
exports.getBrands = async (req, res) => {
    try {
        const brands = await CovBrand.find({ isActive: true }).sort('name');
        res.json(brands);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const brand = new CovBrand(req.body);
        await brand.save();
        res.status(201).json(brand);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- MODELS ---
exports.getModels = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.brandId) {
            query.brand = req.query.brandId;
        }
        const models = await CovModel.find(query).populate('brand', 'name').sort('name');
        res.json(models);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createModel = async (req, res) => {
    try {
        const model = new CovModel(req.body);
        await model.save();
        res.status(201).json(model);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- CATEGORIES ---
exports.getCategories = async (req, res) => {
    try {
        const categories = await CovCategory.find({ isActive: true }).sort('name');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = new CovCategory(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- PRODUCTS (DESIGNS) ---
exports.getProducts = async (req, res) => {
    try {
        const { categoryId, modelId } = req.query;
        const query = { isActive: true };

        if (categoryId) query.category = categoryId;
        // Filter logic for models would need to be checked if 'allowedModels' contains the modelId
        if (modelId) {
            query.allowedModels = modelId;
        }

        const products = await CovProduct.find(query)
            .populate('category', 'name')
            .sort('-createdAt');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Handle Image Upload
        if (req.file) {
            // In production (Vercel), memory storage is used, so file is in buffer
            // But for VPS/DiskStorage, filename is available
            if (req.file.filename) {
                productData.image = `/uploads/${req.file.filename}`;
            } else {
                // Fallback or specific logic for memory storage (e.g. upload to cloud)
                // For now assuming VPS usage with disk storage
                return res.status(400).json({ message: 'Image upload failed (Memory storage not implemented for VPS flow)' });
            }
        } else if (!productData.image) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const product = new CovProduct(productData);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await CovProduct.findById(req.params.id)
            .populate('category', 'name')
            .populate('allowedModels', 'name');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadCustomDesign = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
};

// --- ORDERS ---
exports.createOrder = async (req, res) => {
    try {
        // Basic validation could go here
        const order = new CovOrder(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await CovOrder.find().sort('-createdAt');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await CovOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
