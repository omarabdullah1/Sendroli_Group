import { useEffect, useState } from 'react';
import { materialService } from '../../services/materialService';
import './SupplierForm.css';

const SupplierForm = ({ supplier, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    materialsSupplied: [],
    paymentTerms: 'cash',
    status: 'active',
    notes: ''
  });
  
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        materialsSupplied: supplier.materialsSupplied || [],
        paymentTerms: supplier.paymentTerms || 'cash',
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      });
    }
    fetchMaterials();
  }, [supplier]);

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 100 });
      setAvailableMaterials(response.data.data.materials);
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

  const handleMaterialToggle = (materialName) => {
    setFormData(prev => ({
      ...prev,
      materialsSupplied: prev.materialsSupplied.includes(materialName)
        ? prev.materialsSupplied.filter(m => m !== materialName)
        : [...prev.materialsSupplied, materialName]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'An error occurred while saving the supplier' });
    } finally {
      setLoading(false);
    }
  };

  const materialCategories = {
    paper: availableMaterials.filter(m => m.category === 'paper'),
    ink: availableMaterials.filter(m => m.category === 'ink'),
    chemicals: availableMaterials.filter(m => m.category === 'chemicals'),
    packaging: availableMaterials.filter(m => m.category === 'packaging'),
    tools: availableMaterials.filter(m => m.category === 'tools'),
    other: availableMaterials.filter(m => m.category === 'other')
  };

  return (
    <div className="supplier-form-overlay">
      <div className="supplier-form-modal">
        <div className="form-header">
          <h2>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <button type="button" className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="supplier-form">
          <div className="form-body">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Supplier Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter supplier name"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter email address"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter supplier address"
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="form-section">
              <h3>Business Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentTerms">Payment Terms</label>
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="net_15">Net 15 Days</option>
                    <option value="net_30">Net 30 Days</option>
                    <option value="net_60">Net 60 Days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Materials Supplied */}
            <div className="form-section">
              <h3>Materials Supplied</h3>
              <p className="section-description">
                Select the materials this supplier can provide
              </p>
              
              <div className="materials-grid">
                {Object.entries(materialCategories).map(([category, materials]) => (
                  materials.length > 0 && (
                    <div key={category} className="material-category">
                      <h4 className="category-title">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h4>
                      <div className="material-checkboxes">
                        {materials.map(material => (
                          <label key={material._id} className="material-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.materialsSupplied.includes(material.name)}
                              onChange={() => handleMaterialToggle(material.name)}
                            />
                            <span className="checkmark"></span>
                            <span className="material-name">{material.name}</span>
                            <span className="material-unit">({material.unit})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {formData.materialsSupplied.length > 0 && (
                <div className="selected-materials">
                  <h4>Selected Materials ({formData.materialsSupplied.length})</h4>
                  <div className="selected-list">
                    {formData.materialsSupplied.map(material => (
                      <span key={material} className="selected-material">
                        {material}
                        <button
                          type="button"
                          onClick={() => handleMaterialToggle(material)}
                          className="remove-material"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="form-section">
              <h3>Additional Notes</h3>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any additional notes about this supplier..."
                />
              </div>
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
                supplier ? 'Update Supplier' : 'Add Supplier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;