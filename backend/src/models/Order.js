const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    repeats: {
      type: Number,
      required: [true, 'Number of repeats is required'],
      min: 1,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    deposit: {
      type: Number,
      required: [true, 'Deposit is required'],
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'done', 'delivered'],
      default: 'pending',
    },
    description: {
      type: String,
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate balance before saving
orderSchema.pre('save', function (next) {
  this.balance = this.price - this.deposit;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
