const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  unitCost: {
    type: Number,
    required: true,
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.quantity * this.unitCost;
    }
  }
});

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    unique: true,
    // Remove required since it's auto-generated
  },
  
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  
  items: [purchaseItemSchema],
  
  totalAmount: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'ordered', 'received', 'cancelled'],
    default: 'pending'
  },
  
  orderDate: {
    type: Date,
    default: Date.now
  },
  
  expectedDelivery: {
    type: Date
  },
  
  receivedDate: {
    type: Date
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes must be less than 500 characters']
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
  timestamps: true
});

// Auto-generate purchase number and calculate total
purchaseSchema.pre('save', async function(next) {
  if (this.isNew && !this.purchaseNumber) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseNumber = `PO-${Date.now()}-${count + 1}`;
  }
  
  // Calculate total amount
  this.totalAmount = this.items.reduce((total, item) => {
    item.totalCost = item.quantity * item.unitCost;
    return total + item.totalCost;
  }, 0);
  
  next();
});

// Indexes
purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ orderDate: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);