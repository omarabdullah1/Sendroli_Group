import { useEffect, useState } from 'react';
import './Orders.css';

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

const OrderModal = ({ show, onClose, initialOrder = {}, onSave, user = {}, materials = [], clients = [] }) => {
  const [formData, setFormData] = useState({
    client: initialOrder.client || initialOrder.client?._id || '',
    clientName: initialOrder.clientName || initialOrder.clientSnapshot?.name || '',
    material: initialOrder.material || (initialOrder.material?._id || ''),
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
    setFormData(prev => ({ ...prev,
      client: initialOrder.client || initialOrder.client?._id || prev.client,
      clientName: initialOrder.clientName || initialOrder.clientSnapshot?.name || prev.clientName,
      material: initialOrder.material || initialOrder.material?._id || prev.material,
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

  const recalcPrice = (current) => {
    const materialId = current.material;
    const mat = materials.find(m => m._id === materialId) || null;
    if (!mat || !mat.sellingPrice) {
      return Number(current.totalPrice) || 0;
    }
    const totalSize = calculateTotalSize(current);
    if (totalSize > 0) {
      return Number(mat.sellingPrice) * totalSize;
    }
    return Number(mat.sellingPrice) || 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Always recalc orderSize when repeats or sheetHeight changes
      if (['repeats', 'sheetHeight'].includes(name) || name === 'material') {
        updated.orderSize = calculateTotalSize(updated);
        // Recalc totalPrice when a material is selected or when price should be derived
        updated.totalPrice = recalcPrice(updated);
      }

      // If user manually changes totalPrice, keep it -- but if a material exists we may re-calc
      if (name === 'totalPrice' && updated.material) {
        updated.totalPrice = recalcPrice(updated);
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
    if (!formData.material) {
      setError('Material is required');
      return false;
    }
    const size = calculateTotalSize(formData);
    if (size <= 0) {
      setError('Repeats and sheet height must be greater than zero');
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
        material: formData.material,
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
          <div className="form-row">
              <div className="form-group">
              <label>Material *</label>
              <select name="material" value={formData.material} onChange={handleChange} disabled={isWorker || (isDesigner && !isAdmin)}>
                <option value="">Select material</option>
                {materials.map(m => (
                  <option key={m._id} value={m._id}>{m.name} - {m.sellingPrice} per {m.unit || 'm'}</option>
                ))}
              </select>
            </div>

                <div className="form-group">
                  <label>Height (m) *</label>
                  <input type="number" step="0.01" min="0" name="sheetHeight" value={formData.sheetHeight} onChange={handleChange} disabled={isWorker} />
            </div>

                <div className="form-group">
                  <label>Repeats *</label>
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
          <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Order'}</button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
