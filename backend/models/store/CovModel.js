const mongoose = require('mongoose');

const covModelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CovBrand',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure unique model names per brand
covModelSchema.index({ name: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model('CovModel', covModelSchema);
