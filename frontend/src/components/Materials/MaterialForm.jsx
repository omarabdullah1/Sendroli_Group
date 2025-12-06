import { useEffect, useState } from 'react';
import { supplierService } from '../../services/supplierService';
import './MaterialForm.css';

const MaterialForm = ({ material, onSubmit, onClose, suppliers: propSuppliers = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    unit: 'piece',
    minStockLevel: '',
    currentStock: '',
    costPerUnit: '',
    supplier: '',
    description: '',
    sellingPrice: '',
    isOrderType: false
  });
  
  const [suppliers, setSuppliers] = useState(propSuppliers);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('MaterialForm useEffect - material prop:', material);
    
    if (material && material._id) {
      console.log('Loading material for edit - Full material object:', material);
      console.log('Selling price from material:', material.sellingPrice, 'Type:', typeof material.sellingPrice);
      
      // Extract selling price - handle 0 as valid value
      let sellingPriceValue = '';
      if (material.sellingPrice !== undefined && material.sellingPrice !== null) {
        sellingPriceValue = String(material.sellingPrice);
        console.log('Extracted selling price value:', sellingPriceValue);
      }
      
      const newFormData = {
        name: material.name || '',
        category: material.category || 'other',
        unit: material.unit || 'piece',
        minStockLevel: material.minStockLevel !== undefined && material.minStockLevel !== null ? String(material.minStockLevel) : '',
        currentStock: material.currentStock !== undefined && material.currentStock !== null ? String(material.currentStock) : '',
        costPerUnit: material.costPerUnit !== undefined && material.costPerUnit !== null ? String(material.costPerUnit) : '',
        supplier: material.supplier?._id || material.supplier || '',
        description: material.description || '',
        sellingPrice: sellingPriceValue,
        isOrderType: Boolean(material.isOrderType)
      };
      
      console.log('New form data to set:', newFormData);
      console.log('Selling price in form data:', newFormData.sellingPrice);
      
      setFormData(newFormData);
    } else {
      // Reset form when no material (creating new)
      console.log('No material - resetting form for new material');
      setFormData({
        name: '',
        category: 'other',
        unit: 'piece',
        minStockLevel: '',
        currentStock: '',
        costPerUnit: '',
        supplier: '',
        description: '',
        sellingPrice: '',
        isOrderType: false
      });
    }
    
    // Fetch suppliers if not provided
    if (propSuppliers.length === 0) {
      fetchSuppliers();
    }
  }, [material, propSuppliers.length]); // Watch the entire material object

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required';
    }
    
    if (!formData.minStockLevel || isNaN(formData.minStockLevel) || Number(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = 'Minimum stock level must be a valid positive number';
    }
    
    if (!formData.currentStock || isNaN(formData.currentStock) || Number(formData.currentStock) < 0) {
      newErrors.currentStock = 'Current stock must be a valid positive number';
    }
    
    if (!formData.costPerUnit || isNaN(formData.costPerUnit) || Number(formData.costPerUnit) < 0) {
      newErrors.costPerUnit = 'Cost per unit must be a valid positive number';
    }
    
    // Validate selling price if provided
    if (formData.sellingPrice && formData.sellingPrice !== '' && (isNaN(formData.sellingPrice) || Number(formData.sellingPrice) < 0)) {
      newErrors.sellingPrice = 'Selling price must be a valid positive number';
    }
    
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
      const submitData = {
        ...formData,
        minStockLevel: parseInt(formData.minStockLevel),
        currentStock: parseInt(formData.currentStock),
        costPerUnit: parseFloat(formData.costPerUnit),
        // Properly handle sellingPrice - convert to number if provided, otherwise set to 0
        sellingPrice: formData.sellingPrice && formData.sellingPrice.trim() !== '' 
          ? parseFloat(formData.sellingPrice) 
          : 0,
        isOrderType: Boolean(formData.isOrderType),
        supplier: formData.supplier || null
      };
      
      console.log('Submitting material data:', submitData);
      console.log('Selling price being submitted:', submitData.sellingPrice, 'Type:', typeof submitData.sellingPrice);
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save material. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="material-form-overlay">
      <div className="material-form-modal">
        <div className="form-header">
          <h2>{material ? 'Edit Material' : 'Add New Material'}</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="material-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Material Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter material name"
                required
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="paper">Paper</option>
                <option value="ink">Ink</option>
                <option value="chemicals">Chemicals</option>
                <option value="packaging">Packaging</option>
                <option value="tools">Tools</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="unit">Unit *</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter (L)</option>
                <option value="piece">Piece</option>
                <option value="box">Box</option>
                <option value="roll">Roll</option>
                <option value="sheet">Sheet</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="minStockLevel">Minimum Stock Level *</label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                className={errors.minStockLevel ? 'error' : ''}
                placeholder="Enter minimum stock level"
                min="0"
                required
              />
              {errors.minStockLevel && <span className="error-text">{errors.minStockLevel}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="currentStock">Current Stock *</label>
              <input
                type="number"
                id="currentStock"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className={errors.currentStock ? 'error' : ''}
                placeholder="Enter current stock"
                min="0"
                required
              />
              {errors.currentStock && <span className="error-text">{errors.currentStock}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="costPerUnit">Cost per Unit (EGP) *</label>
              <input
                type="number"
                id="costPerUnit"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleChange}
                className={errors.costPerUnit ? 'error' : ''}
                placeholder="Enter cost per unit"
                min="0"
                step="0.01"
                required
              />
              {errors.costPerUnit && <span className="error-text">{errors.costPerUnit}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="sellingPrice">Selling Price (EGP)</label>
              <input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className={errors.sellingPrice ? 'error' : ''}
                placeholder="Enter selling price (for order types)"
                min="0"
                step="0.01"
              />
              {errors.sellingPrice && <span className="error-text">{errors.sellingPrice}</span>}
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                This price will be used directly when material is selected in orders
              </small>
              {material && (
                <small style={{ color: '#0066cc', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                  Debug: Material sellingPrice = {material.sellingPrice}, Form value = {formData.sellingPrice}
                </small>
              )}
            </div>
            
            {/* <div className="form-group">
              <label htmlFor="isOrderType" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox" 
                  id="isOrderType"
                  name="isOrderType"
                  checked={formData.isOrderType}
                  onChange={handleChange}
                />
                <span>Use as Order Type (DTF, DTFUV, etc.)</span>
              </label>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Check this if this material represents an order type
              </small>
            </div> */}
            
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter material description (optional)"
                rows="3"
              />
            </div>
          </div>
          
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (material ? 'Update Material' : 'Add Material')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;