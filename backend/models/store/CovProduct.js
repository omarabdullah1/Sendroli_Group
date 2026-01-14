const mongoose = require('mongoose');

const covProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CovCategory',
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String, // URL/Path to the design image
        required: true
    },
    // Array of allowed models for this design
    allowedModels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CovModel'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CovProduct', covProductSchema);
