import { useEffect, useState } from 'react';
import MaterialForm from '../components/Materials/MaterialForm';
import MaterialList from '../components/Materials/MaterialList';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { supplierService } from '../services/supplierService';
import './Materials.css';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: '',
    page: 1,
    limit: 10
  });
  
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchMaterials(),
      fetchSuppliers()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMaterials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll(filters);
      setMaterials(response.data.data.materials);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data.data.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setShowForm(true);
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setShowForm(true);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        await materialService.delete(materialId);
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Failed to delete material. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (materialData) => {
    try {
      if (selectedMaterial) {
        await materialService.update(selectedMaterial._id, materialData);
      } else {
        await materialService.create(materialData);
      }
      setShowForm(false);
      fetchMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      throw error;
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      stockStatus: '',
      page: 1,
      limit: 10
    });
  };

  if (loading && materials.length === 0) {
    return (
      <div className="materials-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="materials-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Materials Management</h1>
            <p>Manage your inventory materials and track stock levels</p>
          </div>
          {user?.role === 'admin' && (
            <button 
              className="btn btn-primary"
              onClick={handleCreateMaterial}
            >
              <i className="icon-plus"></i> Add Material
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Materials</label>
              <input
                type="text"
                placeholder="Search by material name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="paper">Paper</option>
                <option value="ink">Ink</option>
                <option value="chemicals">Chemicals</option>
                <option value="packaging">Packaging</option>
                <option value="tools">Tools</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
              >
                <option value="">All Stock Levels</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button 
                className="btn btn-outline"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="materials-stats">
          <div className="stat-card">
            <div className="stat-value">{pagination.total}</div>
            <div className="stat-label">Total Materials</div>
          </div>
          <div className="stat-card low-stock">
            <div className="stat-value">
              {materials.filter(m => m.currentStock <= m.minStockLevel).length}
            </div>
            <div className="stat-label">Low Stock Items</div>
          </div>
          <div className="stat-card out-stock">
            <div className="stat-value">
              {materials.filter(m => m.currentStock <= 0).length}
            </div>
            <div className="stat-label">Out of Stock</div>
          </div>
        </div>

        <div className="materials-table-section">
          <MaterialList
            materials={materials}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
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
        <MaterialForm
          material={selectedMaterial}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Materials;