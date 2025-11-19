const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    // Snapshot of client data at order creation time
    clientSnapshot: {
      name: String,
      phone: String,
      factoryName: String,
    },
    repeats: {
      type: Number,
      min: [1, 'Repeats must be at least 1'],
    },
    sheetSize: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    deposit: {
      type: Number,
      default: 0,
      min: [0, 'Deposit cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },
    orderState: {
      type: String,
      enum: ['pending', 'active', 'done', 'delivered'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    designLink: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate remaining amount before saving
orderSchema.pre('save', function (next) {
  this.remainingAmount = this.totalPrice - this.deposit;
  next();
});

// Update remaining amount before updating
orderSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set && (update.$set.totalPrice !== undefined || update.$set.deposit !== undefined)) {
    const totalPrice = update.$set.totalPrice;
    const deposit = update.$set.deposit;
    
    if (totalPrice !== undefined && deposit !== undefined) {
      update.$set.remainingAmount = totalPrice - deposit;
    }
  }
  next();
});

// Create indexes for search and filtering
orderSchema.index({ orderState: 1, createdAt: -1 });
orderSchema.index({ client: 1 });

module.exports = mongoose.model('Order', orderSchema);
