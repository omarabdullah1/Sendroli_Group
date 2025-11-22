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
    description: ''
  });
  
  const [suppliers, setSuppliers] = useState(propSuppliers);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        category: material.category || 'other',
        unit: material.unit || 'piece',
        minStockLevel: material.minStockLevel || '',
        currentStock: material.currentStock || '',
        costPerUnit: material.costPerUnit || '',
        supplier: material.supplier?._id || '',
        description: material.description || ''
      });
    }
    
    // Fetch suppliers if not provided
    if (propSuppliers.length === 0) {
      fetchSuppliers();
    }
  }, [material, propSuppliers]);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.minStockLevel || formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Minimum stock level must be a positive number';
    }
    
    if (!formData.currentStock || formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock must be a positive number';
    }
    
    if (!formData.costPerUnit || formData.costPerUnit < 0) {
      newErrors.costPerUnit = 'Cost per unit must be a positive number';
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
        supplier: formData.supplier || null
      };
      
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