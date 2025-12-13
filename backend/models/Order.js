const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: function() {
        // Client is required only if invoice is not provided
        return !this.invoice;
      },
    },
    // Snapshot of client data at order creation time
    clientSnapshot: {
      name: String,
      phone: String,
      factoryName: String,
    },
    // Reference to invoice (if part of an invoice)
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    // Client name for invoice orders
    clientName: {
      type: String,
      trim: true,
    },
    repeats: {
      type: Number,
      min: [1, 'Repeats must be at least 1'],
    },
    sheetWidth: {
      type: Number,
      min: [0, 'Sheet width must be positive'],
    },
    sheetHeight: {
      type: Number,
      min: [0, 'Sheet height must be positive'],
    },
    orderSize: {
      type: Number,
      default: 0,
    },
    // Type is now optional - use material instead
    type: {
      type: String,
      trim: true,
    },
    // Reference to material (for pricing)
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
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

// Calculate remaining amount and order size before saving
orderSchema.pre('save', async function (next) {
  try {
    // Calculate order size in meters based on height only (repeats * sheetHeight)
      if (this.repeats && this.sheetHeight !== undefined && this.sheetHeight !== null) {
        // Convert strings to numbers safely if needed
        const r = Number(this.repeats) || 0;
        const h = Number(this.sheetHeight) || 0;
        this.orderSize = r * h;
        console.log('🔧 ORDER MODEL SIZE CALC (pre-save):', { repeats: r, sheetHeight: h, orderSize: this.orderSize });
      }
    
    // If material is selected, calculate total price as selling price per meter * order size
    // Only recalculate if totalPrice is not already set (preserve price set by controller)
    if (this.material && !this.totalPrice) {
      const Material = mongoose.model('Material');
      const material = await Material.findById(this.material);
      if (material) {
        // Set type from material name
        this.type = material.name;
        
          // Calculate total price as selling price per meter * order size (meters)
        if (material.sellingPrice) {
          if (this.orderSize && this.orderSize > 0) {
            this.totalPrice = material.sellingPrice * this.orderSize;
            console.log('🔧 ORDER MODEL PRICE CALCULATION (pre-save):', {
              materialName: material.name,
              sellingPrice: material.sellingPrice,
              orderSize: this.orderSize,
              totalPrice: this.totalPrice,
              calculation: `${material.sellingPrice} * ${this.orderSize} = ${this.totalPrice}`
            });
          } else {
            // If order size is not available yet, use selling price directly (will be recalculated when size is set)
            this.totalPrice = material.sellingPrice;
            console.log('🔧 ORDER MODEL PRICE DEBUG (no size, pre-save):', {
              materialName: material.name,
              sellingPrice: material.sellingPrice,
              totalPrice: this.totalPrice
            });
          }
        }
      }
    } else if (this.material && this.totalPrice) {
      // Material is set and totalPrice is already set, just update type
      const Material = mongoose.model('Material');
      const material = await Material.findById(this.material);
      if (material) {
        this.type = material.name;
        console.log('🔧 ORDER MODEL PRICE DEBUG (price already set):', {
          materialName: material.name,
          existingTotalPrice: this.totalPrice
        });
      }
    }
    
    // Calculate remaining amount
    this.remainingAmount = this.totalPrice - (this.deposit || 0);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update remaining amount and order size before updating
orderSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (update.$set) {
      const { totalPrice, deposit, repeats, sheetWidth, sheetHeight, material } = update.$set;
      
      // Calculate order size based on repeats and sheetHeight only
      let calculatedOrderSize = null;

      // Fetch existing document to use current field values if update only sets one dimension
      const existingOrder = await this.model.findOne(this.getQuery()).lean();

      if (repeats !== undefined || sheetHeight !== undefined) {
        const r = repeats !== undefined ? Number(repeats) : (existingOrder ? Number(existingOrder.repeats) : 0);
        const h = sheetHeight !== undefined ? Number(sheetHeight) : (existingOrder ? Number(existingOrder.sheetHeight) : 0);
        if (r && h) {
          calculatedOrderSize = r * h;
          update.$set.orderSize = calculatedOrderSize;
        } else if (r === 0 || h === 0) {
          // if either dimension is zero or missing, set orderSize to 0
          calculatedOrderSize = 0;
          update.$set.orderSize = calculatedOrderSize;
        }
      } else {
        // If dimensions didn't change, keep existing order size
        if (existingOrder && existingOrder.orderSize !== undefined && existingOrder.orderSize !== null) {
          calculatedOrderSize = existingOrder.orderSize;
        }
      }
      
      // If material changed or size changed, recalculate price from material selling price * order size
      if (material !== undefined || (calculatedOrderSize !== null && material === undefined)) {
        const materialId = material !== undefined ? material : (existingOrder ? existingOrder.material : null);
        if (materialId) {
          const Material = mongoose.model('Material');
          const materialDoc = await Material.findById(materialId);
          if (materialDoc && materialDoc.sellingPrice !== undefined && materialDoc.sellingPrice !== null) {
            const orderSizeToUse = calculatedOrderSize !== null ? calculatedOrderSize : (existingOrder ? existingOrder.orderSize : 0) || 0;
            if (orderSizeToUse > 0) {
              update.$set.totalPrice = materialDoc.sellingPrice * orderSizeToUse;
              update.$set.type = materialDoc.name;
            } else if (materialDoc.sellingPrice) {
              // fallback when order size is zero/unknown: use selling price as base price
              update.$set.totalPrice = materialDoc.sellingPrice;
              update.$set.type = materialDoc.name;
            }
          }
        }
      }
      
      // Calculate remaining amount if price or deposit changed
      const finalPrice = update.$set.totalPrice !== undefined ? update.$set.totalPrice : (existingOrder ? existingOrder.totalPrice : undefined);
      const dep = deposit !== undefined ? deposit : (existingOrder ? existingOrder.deposit : undefined);
      if (finalPrice !== undefined && dep !== undefined) {
        update.$set.remainingAmount = finalPrice - dep;
      } else if (totalPrice !== undefined || deposit !== undefined) {
        const price = totalPrice !== undefined ? totalPrice : (existingOrder ? existingOrder.totalPrice : undefined);
        const dep = deposit !== undefined ? deposit : (existingOrder ? existingOrder.deposit : undefined);
        if (price !== undefined && dep !== undefined) {
          update.$set.remainingAmount = price - dep;
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// After save, update invoice totals if order is part of an invoice
// Also track material usage when order is marked as "done"
orderSchema.post('save', async function(doc) {
  if (doc.invoice) {
    const Invoice = mongoose.model('Invoice');
    const invoice = await Invoice.findById(doc.invoice);
    if (invoice) {
      await invoice.recalculateTotals();
    }
  }
  
  // Track material usage when order is completed (status changes to "done")
  if (doc.orderState === 'done' && doc.material && doc.orderSize) {
    try {
      const Material = mongoose.model('Material');
      const Inventory = mongoose.model('Inventory');
      
      const material = await Material.findById(doc.material);
      if (material) {
        const previousStock = material.currentStock;
          const usedQuantity = doc.orderSize; // Order size in meters
        
        // Decrease material stock
        material.currentStock = Math.max(0, previousStock - usedQuantity);
        await material.save();
        
        // Create inventory record for material usage (orderSize in meters)
        await Inventory.create({
          material: doc.material,
          previousStock,
          systemStock: material.currentStock,
          actualStock: material.currentStock,
          type: 'usage',
          reason: `Order completed: ${doc.clientName || 'N/A'}`,
          notes: `Order size: ${usedQuantity.toFixed(2)} m`,
          countedBy: doc.createdBy
        });
        
        console.log('Material stock decreased:', {
          material: material.name,
          previousStock,
          usedQuantity,
          newStock: material.currentStock
        });
      }
    } catch (error) {
      console.error('Error tracking material usage:', error);
    }
  }
});

// After update, update invoice totals if order is part of an invoice
// Also track material usage when order status changes to "done"
orderSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.invoice) {
    const Invoice = mongoose.model('Invoice');
    const invoice = await Invoice.findById(doc.invoice);
    if (invoice) {
      await invoice.recalculateTotals();
    }
  }
  
  // Track material usage when order status changes to "done"
  if (doc && doc.orderState === 'done' && doc.material && doc.orderSize) {
    try {
      // Check if this order was already marked as "done" before
      const Inventory = mongoose.model('Inventory');
      const existingUsageRecord = await Inventory.findOne({
        type: 'usage',
        notes: { $regex: `Order ID: ${doc._id}` }
      });
      
      // Only decrease stock if not already recorded
      if (!existingUsageRecord) {
        const Material = mongoose.model('Material');
        const material = await Material.findById(doc.material);
        
        if (material) {
          const previousStock = material.currentStock;
            const usedQuantity = doc.orderSize; // Order size in meters
          
          // Decrease material stock
          material.currentStock = Math.max(0, previousStock - usedQuantity);
          await material.save();
          
          // Create inventory record for material usage (orderSize in meters)
          await Inventory.create({
            material: doc.material,
            previousStock,
            systemStock: material.currentStock,
            actualStock: material.currentStock,
            type: 'usage',
            reason: `Order completed: ${doc.clientName || 'N/A'}`,
            notes: `Order size: ${usedQuantity.toFixed(2)} m | Order ID: ${doc._id}`,
            countedBy: doc.updatedBy || doc.createdBy
          });
          
          console.log('Material stock decreased (update):', {
            material: material.name,
            previousStock,
            usedQuantity,
            newStock: material.currentStock
          });
        }
      }
    } catch (error) {
      console.error('Error tracking material usage on update:', error);
    }
  }
});

// After delete, update invoice totals if order was part of an invoice
orderSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.invoice) {
    const Invoice = mongoose.model('Invoice');
    const invoice = await Invoice.findById(doc.invoice);
    if (invoice) {
      await invoice.recalculateTotals();
    }
  }
});

// Create indexes for search and filtering
orderSchema.index({ orderState: 1, createdAt: -1 });
orderSchema.index({ client: 1 });
orderSchema.index({ invoice: 1 });

module.exports = mongoose.model('Order', orderSchema);
