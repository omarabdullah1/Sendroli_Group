const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
    maxlength: [100, 'Material name must be less than 100 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['paper', 'ink', 'chemicals', 'packaging', 'tools', 'other'],
    default: 'other'
  },
  
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'liter', 'piece', 'box', 'roll', 'sheet'],
    default: 'piece'
  },
  
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative']
  },
  
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Current stock cannot be negative']
  },
  
  costPerUnit: {
    type: Number,
    required: [true, 'Cost per unit is required'],
    min: [0, 'Cost cannot be negative']
  },
  
  // Selling price for order types (DTF, DTFUV, etc.)
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
    default: 0
  },
  
  // Indicates if this material is used for order pricing
  isOrderType: {
    type: Boolean,
    default: false
  },
  
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be less than 500 characters']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
materialSchema.index({ name: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ currentStock: 1 });
materialSchema.index({ minStockLevel: 1 });

// Virtual for stock status
materialSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockLevel) return 'low_stock';
  return 'in_stock';
});

module.exports = mongoose.model('Material', materialSchema);