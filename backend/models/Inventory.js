const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Inventory date is required'],
    default: Date.now
  },
  
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material is required']
  },
  
  previousStock: {
    type: Number,
    required: true
  },
  
  actualStock: {
    type: Number,
    required: [true, 'Actual stock count is required'],
    min: [0, 'Actual stock cannot be negative']
  },
  
  difference: {
    type: Number,
    default: function() {
      return this.actualStock - this.previousStock;
    }
  },
  
  type: {
    type: String,
    enum: ['daily_count', 'adjustment', 'wastage', 'usage'],
    required: true
  },
  
  reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reason must be less than 200 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes must be less than 500 characters']
  },
  
  countedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
inventorySchema.index({ date: -1 });
inventorySchema.index({ material: 1 });
inventorySchema.index({ type: 1 });

// Pre-save hook to calculate difference
inventorySchema.pre('save', function(next) {
  this.difference = this.actualStock - this.previousStock;
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);