const mongoose = require('mongoose');

const covShippingSchema = new mongoose.Schema({
    city: {
        type: String,
        required: [true, 'City name is required'],
        unique: true,
        trim: true
    },
    cost: {
        type: Number,
        required: [true, 'Shipping cost is required'],
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CovShipping', covShippingSchema);
