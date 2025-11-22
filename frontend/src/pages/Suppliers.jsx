import { useEffect, useState } from 'react';
import SupplierForm from '../components/Suppliers/SupplierForm';
import SupplierList from '../components/Suppliers/SupplierList';
import { useAuth } from '../context/AuthContext';
import { supplierService } from '../services/supplierService';
import './Suppliers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  
  const { user } = useAuth();

  useEffect(() => {
    fetchSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll(filters);
      setSuppliers(response.data.data.suppliers);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setShowForm(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowForm(true);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      try {
        await supplierService.delete(supplierId);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (supplierData) => {
    try {
      if (selectedSupplier) {
        await supplierService.update(selectedSupplier._id, supplierData);
      } else {
        await supplierService.create(supplierData);
      }
      setShowForm(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      throw error;
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="suppliers-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Suppliers Management</h1>
            <p>Manage your suppliers and their contact information</p>
          </div>
          {user?.role === 'admin' && (
            <button 
              className="btn btn-primary"
              onClick={handleCreateSupplier}
            >
              <i className="icon-plus"></i> Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Suppliers</label>
              <input
                type="text"
                placeholder="Search by supplier or contact person name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        <div className="suppliers-stats">
          <div className="stat-card">
            <div className="stat-value">{pagination.total}</div>
            <div className="stat-label">Total Suppliers</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">
              {suppliers.filter(s => s.isActive).length}
            </div>
            <div className="stat-label">Active Suppliers</div>
          </div>
        </div>

        <div className="suppliers-table-section">
          <SupplierList
            suppliers={suppliers}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
            userRole={user?.role}
          />
          
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn"
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
              >
                Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(pagination.pages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`page-btn ${pagination.current === index + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <button 
                className="page-btn"
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SupplierForm
          supplier={selectedSupplier}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Suppliers;