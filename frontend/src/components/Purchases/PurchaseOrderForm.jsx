import { useEffect, useState } from 'react';
import { materialService } from '../../services/materialService';
import { supplierService } from '../../services/supplierService';
import './PurchaseOrderForm.css';

const PurchaseOrderForm = ({ onSubmit, onCancel, purchase }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    notes: '',
    items: []
  });

  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedSupplierMaterials, setSelectedSupplierMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSuppliers();
    fetchMaterials();

    if (purchase) {
      setFormData({
        supplier: purchase.supplier._id,
        orderDate: new Date(purchase.orderDate).toISOString().split('T')[0],
        expectedDelivery: purchase.expectedDelivery ? new Date(purchase.expectedDelivery).toISOString().split('T')[0] : '',
        notes: purchase.notes || '',
        items: purchase.items.map(item => ({
          material: item.material._id || item.material,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost
        })) || []
      });
    }
  }, [purchase]);

  useEffect(() => {
    if (formData.supplier) {
      const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
      if (selectedSupplier && selectedSupplier.materialsSupplied && selectedSupplier.materialsSupplied.length > 0) {
        // Filter materials based on supplier's materials
        const supplierMaterials = materials.filter(m => 
          selectedSupplier.materialsSupplied.includes(m.name)
        );
        setSelectedSupplierMaterials(supplierMaterials);
      } else {
        // If no materials specified for supplier, show all materials
        setSelectedSupplierMaterials(materials);
      }
    } else {
      setSelectedSupplierMaterials([]);
    }
  }, [formData.supplier, suppliers, materials]);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll({ limit: 100 });
      setSuppliers(response.data.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 100 });
      setMaterials(response.data.data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        material: '',
        quantity: 1,
        unitCost: 0.00,
        totalCost: 0.00
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };

      // Calculate total price for this item
      if (field === 'quantity' || field === 'unitCost') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
        const unitCost = field === 'unitCost' ? parseFloat(value) || 0 : newItems[index].unitCost;
        newItems[index].totalCost = quantity * unitCost;
      }

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.material) {
        newErrors[`item_${index}_material`] = 'Material is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitCost || item.unitCost <= 0) {
        newErrors[`item_${index}_unitCost`] = 'Unit cost must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const purchaseData = {
        ...formData,
        totalAmount: getTotalAmount()
      };

      console.log('Submitting purchase data:', JSON.stringify(purchaseData, null, 2));

      await onSubmit(purchaseData);
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      setErrors({ submit: 'An error occurred while saving the purchase order' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  return (
    <div className="purchase-form-overlay">
      <div className="purchase-form-modal">
        <div className="form-header">
          <h2>{purchase ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
          <button type="button" className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="purchase-form">
          <div className="form-body">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Order Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="supplier">Supplier *</label>
                  <select
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className={errors.supplier ? 'error' : ''}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} {supplier.company && `(${supplier.company})`}
                      </option>
                    ))}
                  </select>
                  {errors.supplier && <span className="error-message">{errors.supplier}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="orderDate">Order Date *</label>
                  <input
                    type="date"
                    id="orderDate"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleInputChange}
                    className={errors.orderDate ? 'error' : ''}
                  />
                  {errors.orderDate && <span className="error-message">{errors.orderDate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="expectedDelivery">Expected Delivery</label>
                  <input
                    type="date"
                    id="expectedDelivery"
                    name="expectedDelivery"
                    value={formData.expectedDelivery}
                    onChange={handleInputChange}
                    min={formData.orderDate}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes or special instructions..."
                />
              </div>
            </div>

            {/* Purchase Items */}
            <div className="form-section">
              <div className="section-header">
                <h3>Purchase Items</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addItem}
                  disabled={!formData.supplier}
                >
                  + Add Item
                </button>
              </div>

              {errors.items && <span className="error-message">{errors.items}</span>}

              {formData.items.length === 0 ? (
                <div className="empty-items">
                  <p>No items added yet. {formData.supplier ? 'Click "Add Item" to start.' : 'Select a supplier first.'}</p>
                </div>
              ) : (
                <div className="items-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-fields">
                        <div className="form-group">
                          <label>Material *</label>
                          <select
                            value={item.material}
                            onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                            className={errors[`item_${index}_material`] ? 'error' : ''}
                          >
                            <option value="">Select Material</option>
                            {selectedSupplierMaterials.map(material => (
                              <option key={material._id} value={material._id}>
                                {material.name} ({material.unit})
                              </option>
                            ))}
                          </select>
                          {errors[`item_${index}_material`] && (
                            <span className="error-message">{errors[`item_${index}_material`]}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="1"
                            step="1"
                            className={errors[`item_${index}_quantity`] ? 'error' : ''}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <span className="error-message">{errors[`item_${index}_quantity`]}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Unit Cost *</label>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                            min="0"
                            step="0.01"
                            className={errors[`item_${index}_unitCost`] ? 'error' : ''}
                          />
                          {errors[`item_${index}_unitCost`] && (
                            <span className="error-message">{errors[`item_${index}_unitCost`]}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Total</label>
                          <div className="total-price">
                            {formatCurrency(item.totalCost || 0)}
                          </div>
                        </div>

                        <div className="form-group">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeItem(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.items.length > 0 && (
                <div className="order-total">
                  <h4>Total Amount: {formatCurrency(getTotalAmount())}</h4>
                </div>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          <div className="form-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner small"></span>
                  Saving...
                </>
              ) : (
                purchase ? 'Update Purchase Order' : 'Create Purchase Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;