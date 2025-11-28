import { useEffect, useState } from 'react';
import MaterialForm from '../components/Materials/MaterialForm';
import MaterialList from '../components/Materials/MaterialList';
import { useAuth } from '../context/AuthContext';
import { materialService } from '../services/materialService';
import { supplierService } from '../services/supplierService';
import Loading from '../components/Loading';
import SearchAndFilters from '../components/SearchAndFilters';
import Pagination from '../components/Pagination';
import './Materials.css';

const Materials = () => {
  const [allMaterials, setAllMaterials] = useState([]); // Store all fetched materials
  const [materials, setMaterials] = useState([]); // Displayed materials (filtered + paginated)
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
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchAllMaterials(),
      fetchSuppliers()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.search, filters.category, filters.stockStatus, selectedSupplier, startDate, endDate]);

  useEffect(() => {
    applyFiltersAndPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMaterials, filters, selectedSupplier, startDate, endDate, currentPage]);

  // Fetch all materials once
  const fetchAllMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll({ limit: 10000 });
      setAllMaterials(response.data.data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setAllMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = () => {
    try {
      let filteredMaterials = [...allMaterials];
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredMaterials = filteredMaterials.filter(material => 
          material.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Category filter
      if (filters.category) {
        filteredMaterials = filteredMaterials.filter(material => 
          material.category === filters.category
        );
      }
      
      // Stock status filter
      if (filters.stockStatus === 'low_stock') {
        filteredMaterials = filteredMaterials.filter(material => 
          material.currentStock <= material.minStockLevel
        );
      } else if (filters.stockStatus === 'out_of_stock') {
        filteredMaterials = filteredMaterials.filter(material => 
          material.currentStock <= 0
        );
      }
      
      // Supplier filter
      if (selectedSupplier) {
        filteredMaterials = filteredMaterials.filter(material => 
          material.supplier?._id === selectedSupplier || material.supplier === selectedSupplier
        );
      }
      
      // Date range filter
      if (startDate || endDate) {
        filteredMaterials = filteredMaterials.filter(material => {
          const materialDate = new Date(material.createdAt || material.date);
          if (startDate && materialDate < new Date(startDate)) return false;
          if (endDate && materialDate > new Date(endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Calculate pagination
      const total = filteredMaterials.length;
      const totalPages = Math.ceil(total / itemsPerPage) || 1;
      setPagination({ 
        current: currentPage, 
        pages: totalPages, 
        total: total 
      });
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);
      
      setMaterials(paginatedMaterials);
    } catch (error) {
      console.error('Error applying filters:', error);
      setMaterials([]);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      stockStatus: '',
      page: 1,
      limit: 10
    });
    setSelectedSupplier('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
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

  const handleEditMaterial = async (material) => {
    console.log('Edit material clicked:', material);
    // Fetch full material data to ensure we have all fields including sellingPrice
    try {
      const response = await materialService.getById(material._id);
      const fullMaterial = response.data.data;
      console.log('Full material data from API:', fullMaterial);
      setSelectedMaterial(fullMaterial);
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching material details:', error);
      // Fallback to using the material from list
      setSelectedMaterial(material);
      setShowForm(true);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        await materialService.delete(materialId);
        fetchAllMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Failed to delete material. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (materialData) => {
    try {
      console.log('Submitting material data:', materialData);
      console.log('Selling price in submit:', materialData.sellingPrice);
      let response;
      if (selectedMaterial) {
        console.log('Updating material:', selectedMaterial._id);
        response = await materialService.update(selectedMaterial._id, materialData);
        console.log('Update response:', response.data);
        console.log('Updated material sellingPrice:', response.data.data?.sellingPrice);
      } else {
        console.log('Creating new material');
        response = await materialService.create(materialData);
        console.log('Create response:', response.data);
      }
      setShowForm(false);
      setSelectedMaterial(null);
      // Small delay to ensure backend has saved
      await new Promise(resolve => setTimeout(resolve, 100));
      // Refresh materials list to show updated data
      await fetchMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      throw error;
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    // Page reset is handled by useEffect
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
        <Loading message="Loading materials..." size="medium" />
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
              Add Material
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Search and Filters */}
        <SearchAndFilters
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          clients={suppliers.map(s => ({ _id: s._id, name: s.name }))} // Map suppliers as clients
          selectedClient={selectedSupplier}
          onClientChange={setSelectedSupplier}
          states={[
            { value: '', label: 'All Categories' },
            { value: 'paper', label: 'Paper' },
            { value: 'ink', label: 'Ink' },
            { value: 'chemicals', label: 'Chemicals' },
            { value: 'packaging', label: 'Packaging' },
            { value: 'tools', label: 'Tools' },
            { value: 'other', label: 'Other' },
          ]}
          selectedState={filters.category}
          onStateChange={(value) => handleFilterChange('category', value)}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
          searchPlaceholder="Search by material name..."
        />
        
        {/* Stock Status Filter (separate since it's specific to materials) */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary, #111827)' }}>
            Stock Status:
          </label>
          <select
            value={filters.stockStatus}
            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-medium, #d1d5db)',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          >
            <option value="">All Stock Levels</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
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
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.current}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          )}
        </div>
      </div>

      {showForm && (
        <MaterialForm
          key={selectedMaterial?._id || 'new'}
          material={selectedMaterial}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </div>
  );
};

export default Materials;