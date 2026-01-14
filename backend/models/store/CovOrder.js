const mongoose = require('mongoose');

const covOrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CovProduct',
        required: true
    },
    model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CovModel',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true // Snapshot of price at time of order
    },
    productSnapshot: {
        title: String,
        image: String
    },
    modelSnapshot: {
        name: String,
        brandName: String
    }
});

const covOrderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    phoneSecondary: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['New', 'Printed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'New'
    },
    items: [covOrderItemSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('CovOrder', covOrderSchema);
