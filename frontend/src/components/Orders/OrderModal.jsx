import { useEffect, useState } from 'react';
import './Orders.css';

// Adding styles via inline style tag inside OrderModal for now, or just generic CSS in Orders.css if I can query it?
// Wait, I am editing OrderModal.jsx. I can add the styles in Orders.css if I want.
// No, I can't edit Orders.css via this tool easily without listing content.
// I will just add a <style> block in OrderModal.jsx for the toggle.

/**
 * OrderModal
 * Props:
 * - show: boolean, whether modal is visible
 * - onClose: callback to close the modal
 * - initialOrder: object, initial values for editing
 * - onSave: (orderData) => Promise|void
 * - user: current user object to apply role restrictions
 * - materials: materials list to show
 * - clients: clients list (optional)
 */

const OrderModal = ({ show, onClose, initialOrder = {}, onSave, user = {}, materials = [], products = [], clients = [] }) => {
  const [itemType, setItemType] = useState(initialOrder.product ? 'product' : (initialOrder.material ? 'material' : 'product')); // Default to 'product'

  const [formData, setFormData] = useState({
    client: initialOrder.client || initialOrder.client?._id || '',
    clientName: initialOrder.clientName || initialOrder.clientSnapshot?.name || '',
    material: initialOrder.material || (initialOrder.material?._id || ''),
    product: initialOrder.product || (initialOrder.product?._id || ''),
    repeats: initialOrder.repeats || 1,
    sheetHeight: initialOrder.sheetHeight || '',
    totalPrice: initialOrder.totalPrice || 0,
    orderSize: initialOrder.orderSize || (initialOrder.repeats && initialOrder.sheetHeight ? Number(initialOrder.repeats) * Number(initialOrder.sheetHeight) : 0),
    deposit: initialOrder.deposit || 0,
    orderState: initialOrder.orderState || 'pending',
    notes: initialOrder.notes || '',
    designLink: initialOrder.designLink || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Determine item type based on initial order, default to 'product'
    const newItemType = initialOrder.product ? 'product' : (initialOrder.material ? 'material' : 'product');
    setItemType(newItemType);

    setFormData(prev => ({
      ...prev,
      client: initialOrder.client || initialOrder.client?._id || prev.client,
      clientName: initialOrder.clientName || initialOrder.clientSnapshot?.name || prev.clientName,
      material: initialOrder.material || initialOrder.material?._id || prev.material,
      product: initialOrder.product || initialOrder.product?._id || prev.product,
      repeats: initialOrder.repeats || prev.repeats,
      sheetHeight: initialOrder.sheetHeight || prev.sheetHeight,
      totalPrice: initialOrder.totalPrice || prev.totalPrice,
      orderSize: initialOrder.orderSize || (initialOrder.repeats && initialOrder.sheetHeight ? Number(initialOrder.repeats) * Number(initialOrder.sheetHeight) : prev.orderSize),
      deposit: initialOrder.deposit || prev.deposit,
      orderState: initialOrder.orderState || prev.orderState,
      notes: initialOrder.notes || prev.notes,
      designLink: initialOrder.designLink || prev.designLink,
    }));
  }, [initialOrder, show]);

  const calculateTotalSize = (data) => {
    const r = Number(data.repeats) || 0;
    const h = Number(data.sheetHeight) || 0;
    if (r <= 0 || h <= 0) return 0;
    return r * h; // meters
  };

  const recalcPrice = (current, type = itemType) => {
    if (type === 'product') {
      const prodId = current.product;
      const prod = products.find(p => p._id === prodId || p.id === prodId);
      if (prod && prod.sellingPrice) {
        // Price is Product Price * Repeats (if we treat repeats as quantity)
        // Or just Product Price. Let's assume Repeats is Quantity.
        const quantity = Number(current.repeats) || 1;
        // However, the backend logic I wrote earlier sets totalPrice = sellingPrice.
        // Let's stick to what I did in backend: totalPrice = sellingPrice * (calculateOrderSize if > 0 else 1) ??
        // Actually in backend: "orderData.totalPrice = productDoc.sellingPrice;" I commented out repeats logic.
        // But usually products are sold by quantity.
        // Let's assume Price = Unit Price * Repeats.
        return Number(prod.sellingPrice) * quantity;
      }
      return 0;
    } else {
      // Material logic
      const materialId = current.material;
      const mat = materials.find(m => m._id === materialId) || null;
      if (!mat || !mat.sellingPrice) {
        // Check if we should preserve existing price or reset
        return current.totalPrice ? Number(current.totalPrice) : 0;
      }
      const totalSize = calculateTotalSize(current);
      if (totalSize > 0) {
        return Number(mat.sellingPrice) * totalSize;
      }
      return Number(mat.sellingPrice) || 0;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Always recalc orderSize when repeats or sheetHeight changes
      if (['repeats', 'sheetHeight'].includes(name)) {
        updated.orderSize = calculateTotalSize(updated);
        // Recalc totalPrice
        updated.totalPrice = recalcPrice(updated);
      }

      if (name === 'material') {
        updated.orderSize = calculateTotalSize(updated);
        updated.totalPrice = recalcPrice(updated, 'material');
      }

      if (name === 'product') {
        updated.totalPrice = recalcPrice(updated, 'product');
      }

      // If user manually changes totalPrice, keep it -- unless type is product/material logic overrides it?
      // For now, allow manual override, but changing other fields might reset it.
      if (name === 'totalPrice') {
        // manual override
      } else if (name === 'totalPrice' && updated.material) {
        // updated.totalPrice = recalcPrice(updated); // Don't force recalc if manual edit
      }

      return updated;
    });
  };

  const handleTypeChange = (type) => {
    setItemType(type);
    // Reset relevant fields
    setFormData(prev => {
      const updated = { ...prev };
      if (type === 'product') {
        updated.material = '';
        updated.sheetHeight = ''; // Products might not need height?
        updated.repeats = 1;
        updated.totalPrice = 0;
      } else {
        updated.product = '';
        updated.repeats = 1;
        updated.totalPrice = 0;
      }
      return updated;
    });
  };

  // Role-based helpers
  const isAdmin = user?.role === 'admin';
  const isDesigner = user?.role === 'designer';
  const isWorker = user?.role === 'worker';
  const isFinancial = user?.role === 'financial';

  const validate = () => {
    if (!formData.client && !formData.clientName) {
      setError('Client or client name is required');
      return false;
    }

    if (itemType === 'material' && !formData.material) {
      setError('Material is required');
      return false;
    }

    if (itemType === 'product' && !formData.product) {
      setError('Product is required');
      return false;
    }

    const size = calculateTotalSize(formData);
    // Only require positive size if using Material (printing)
    if (itemType === 'material' && size <= 0) {
      setError('Repeats and sheet height must be greater than zero for material orders');
      return false;
    }

    if (itemType === 'product' && (Number(formData.repeats) || 0) <= 0) {
      setError('Repeats (Quantity) must be greater than zero');
      return false;
    }

    if (formData.deposit < 0) {
      setError('Deposit cannot be negative');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        client: formData.client || undefined,
        clientName: formData.clientName || undefined,
        material: itemType === 'material' ? formData.material : undefined,
        product: itemType === 'product' ? formData.product : undefined,
        repeats: Number(formData.repeats) || 0,
        sheetHeight: Number(formData.sheetHeight) || 0,
        totalPrice: Number(formData.totalPrice) || 0,
        orderSize: Number(formData.orderSize) || calculateTotalSize(formData),
        deposit: Number(formData.deposit) || 0,
        orderState: formData.orderState,
        notes: formData.notes,
        designLink: formData.designLink,
      };
      await onSave(payload);
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content shared-order-modal">
        <div className="modal-header">
          <h3>{initialOrder._id ? 'Edit Order' : 'Add Order'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div className="form-row type-toggle-row">
            <div className="type-toggle">
              <label className={`toggle-option ${itemType === 'material' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="itemType"
                  value="material"
                  checked={itemType === 'material'}
                  onChange={() => handleTypeChange('material')}
                  style={{ display: 'none' }}
                />
                Material (Print)
              </label>
              <label className={`toggle-option ${itemType === 'product' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="itemType"
                  value="product"
                  checked={itemType === 'product'}
                  onChange={() => handleTypeChange('product')}
                  style={{ display: 'none' }}
                />
                Product (Item)
              </label>
            </div>
          </div>

          <div className="form-row">
            {itemType === 'material' ? (
              <div className="form-group">
                <label>Material *</label>
                <select name="material" value={formData.material} onChange={handleChange} disabled={isWorker || (isDesigner && !isAdmin)}>
                  <option value="">Select material</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>{m.name} - {m.sellingPrice} per {m.unit || 'm'}</option>
                  ))}
                </select>
                {materials.length === 0 && (
                  <div className="hint-message" style={{ marginTop: '6px', color: '#6b7280', fontSize: '0.9rem' }}>
                    No materials available.
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>Product *</label>
                <select name="product" value={formData.product} onChange={handleChange} disabled={isWorker || (isDesigner && !isAdmin)}>
                  <option value="">Select product</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name} - {p.sellingPrice} EGP</option>
                  ))}
                </select>
                {products.length === 0 && (
                  <div className="hint-message" style={{ marginTop: '6px', color: '#6b7280', fontSize: '0.9rem' }}>
                    No products available.
                  </div>
                )}
              </div>
            )}

            {itemType === 'material' && (
              <div className="form-group">
                <label>Height (m) *</label>
                <input type="number" step="0.01" min="0" name="sheetHeight" value={formData.sheetHeight} onChange={handleChange} disabled={isWorker} />
              </div>
            )}

            <div className="form-group">
              <label>{itemType === 'product' ? 'Quantity *' : 'Repeats *'}</label>
              <input type="number" step="1" min="1" name="repeats" value={formData.repeats} onChange={handleChange} disabled={isWorker} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input type="number" step="0.01" min="0" name="totalPrice" value={formData.totalPrice} onChange={handleChange} disabled={isWorker || isDesigner} />
            </div>

            <div className="form-group">
              <label>Deposit</label>
              <input type="number" step="0.01" min="0" name="deposit" value={formData.deposit} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="orderState" value={formData.orderState} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange}></textarea>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Design Link</label>
              <input type="url" name="designLink" value={formData.designLink} onChange={handleChange} placeholder="https://example.com/design.pdf" />
            </div>

            <div className="form-group">
              <label>Client Name (if invoice)</label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Client (if registered)</label>
              <select name="client" value={formData.client} onChange={handleChange}>
                <option value="">Select client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="order-size-display"><strong>Order Size:</strong> {calculateTotalSize(formData).toFixed(2)} m</div>

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : (initialOrder._id ? 'Update Order' : 'Add Order')}</button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;

const style = document.createElement('style');
style.textContent = `
  .type-toggle-row {
    margin-bottom: 20px;
  }
  .type-toggle {
    display: flex;
    background: #e5e7eb;
    padding: 4px;
    border-radius: 8px;
    width: fit-content;
  }
  .toggle-option {
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    color: #4b5563;
    transition: all 0.2s;
    user-select: none;
  }
  .toggle-option.active {
    background: #fff;
    color: #00CED1;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(style);

