const CovBrand = require('../models/store/CovBrand');
const CovModel = require('../models/store/CovModel');
const CovCategory = require('../models/store/CovCategory');
const CovProduct = require('../models/store/CovProduct');
const CovOrder = require('../models/store/CovOrder');
const CovShipping = require('../models/store/CovShipping');

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
        const brandData = { ...req.body };
        if (req.file) {
            brandData.logo = `/uploads/${req.file.filename}`;
        }
        const brand = new CovBrand(brandData);
        await brand.save();
        res.status(201).json(brand);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) {
            updates.logo = `/uploads/${req.file.filename}`;
        }
        const brand = await CovBrand.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(brand);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        // Soft delete
        await CovBrand.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Brand deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

exports.updateModel = async (req, res) => {
    try {
        const model = await CovModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(model);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteModel = async (req, res) => {
    try {
        await CovModel.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Model deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- CATEGORIES ---
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
        const categoryData = { ...req.body };
        if (req.file) {
            categoryData.coverImage = `/uploads/${req.file.filename}`;
        }
        const category = new CovCategory(categoryData);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) {
            updates.coverImage = `/uploads/${req.file.filename}`;
        }
        const category = await CovCategory.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await CovCategory.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- SHIPPING ---
exports.getShipping = async (req, res) => {
    try {
        const shipping = await CovShipping.find({ isActive: true }).sort('city');
        res.json(shipping);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createShipping = async (req, res) => {
    try {
        const shipping = new CovShipping(req.body);
        await shipping.save();
        res.status(201).json(shipping);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateShipping = async (req, res) => {
    try {
        const shipping = await CovShipping.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(shipping);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteShipping = async (req, res) => {
    try {
        await CovShipping.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Shipping zone deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- CUSTOMERS ---
exports.getStoreCustomers = async (req, res) => {
    try {
        // Aggregate unique customers from orders
        const customers = await CovOrder.aggregate([
            {
                $group: {
                    _id: "$phone",
                    fullName: { $first: "$fullName" },
                    phone: { $first: "$phone" },
                    secondaryPhone: { $first: "$secondaryPhone" },
                    address: { $first: "$address" },
                    city: { $first: "$city" },
                    totalOrders: { $sum: 1 },
                    lastOrderDate: { $max: "$createdAt" },
                    totalSpent: { $sum: "$total" }
                }
            },
            { $sort: { lastOrderDate: -1 } }
        ]);
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        console.log('📝 createProduct Request:');
        console.log('Headers Content-Type:', req.headers['content-type']);
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);

        let productData = { ...req.body };

        // Parse allowedModels if it comes as a stringified JSON or single string
        if (productData.allowedModels) {
            if (typeof productData.allowedModels === 'string') {
                try {
                    // Try parsing as JSON (e.g. "['id1', 'id2']")
                    const parsed = JSON.parse(productData.allowedModels);
                    if (Array.isArray(parsed)) {
                        productData.allowedModels = parsed;
                    } else {
                        // If single ID string
                        productData.allowedModels = [productData.allowedModels];
                    }
                } catch (e) {
                    // If not JSON, assume comma separated or single ID
                    if (productData.allowedModels.includes(',')) {
                        productData.allowedModels = productData.allowedModels.split(',').map(s => s.trim());
                    } else {
                        productData.allowedModels = [productData.allowedModels];
                    }
                }
            }
        }

        // Handle Image Upload
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        } else {
            // Remove 'image' from body if it's empty object or invalid, to trigger "required" error unless valid URL provided
            if (typeof productData.image === 'object' && Object.keys(productData.image).length === 0) {
                delete productData.image;
            }
            if (!productData.image) {
                return res.status(400).json({ message: 'Image is required' });
            }
        }

        const product = new CovProduct(productData);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error("Create Product Error:", err);
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
