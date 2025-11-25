const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    // Snapshot of client data at invoice creation time
    clientSnapshot: {
      name: String,
      phone: String,
      factoryName: String,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    totalRemaining: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'],
      default: 'draft',
    },
    notes: {
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

// Virtual to get orders for this invoice
invoiceSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'invoice',
});

// Enable virtuals in JSON
invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

// Method to recalculate totals from orders
invoiceSchema.methods.recalculateTotals = async function() {
  const Order = mongoose.model('Order');
  const orders = await Order.find({ invoice: this._id });
  
  console.log('🔧 INVOICE RECALCULATION DEBUG:', {
    invoiceId: this._id,
    orderCount: orders.length,
    orderPrices: orders.map(order => ({
      id: order._id,
      totalPrice: order.totalPrice,
      type: typeof order.totalPrice
    }))
  });
  
  // Subtotal: Raw sum of all order prices (before deposit, discount, shipping, tax)
  this.subtotal = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  
  // Total: Subtotal + Tax + Shipping - Discount (after discount, shipping, tax, but before deposits)
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  
  // Calculate total deposits paid from all orders
  const totalDeposits = orders.reduce((sum, order) => sum + (order.deposit || 0), 0);
  
  // Total Remaining: Total - Total Deposits (after deposit, discount, shipping, tax)
  // This is the amount the customer still owes
  this.totalRemaining = this.total - totalDeposits;
  
  console.log('🔧 INVOICE RECALCULATION RESULT:', {
    subtotal: this.subtotal,
    tax: this.tax,
    shipping: this.shipping,
    discount: this.discount,
    total: this.total,
    totalDeposits: totalDeposits,
    totalRemaining: this.totalRemaining
  });
  
  return this.save();
};

// Create indexes for search and filtering
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
