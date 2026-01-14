const mongoose = require('mongoose');

const covCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    coverImage: {
        type: String, // URL/Path to category cover image
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CovCategory', covCategorySchema);
