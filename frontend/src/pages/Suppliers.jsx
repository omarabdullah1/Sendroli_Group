import { useEffect, useState } from 'react';
import SupplierForm from '../components/Suppliers/SupplierForm';
import SupplierList from '../components/Suppliers/SupplierList';
import { useAuth } from '../context/AuthContext';
import { supplierService } from '../services/supplierService';
import Loading from '../components/Loading';
import SearchAndFilters from '../components/SearchAndFilters';
import Pagination from '../components/Pagination';
import './Suppliers.css';

const Suppliers = () => {
  const [allSuppliers, setAllSuppliers] = useState([]); // Store all fetched suppliers
  const [suppliers, setSuppliers] = useState([]); // Displayed suppliers (filtered + paginated)
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchAllSuppliers();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.search, selectedStatus, startDate, endDate]);

  useEffect(() => {
    applyFiltersAndPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSuppliers, filters.search, selectedStatus, startDate, endDate, currentPage]);

  // Fetch all suppliers once
  const fetchAllSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll({ limit: 10000 });
      setAllSuppliers(response.data.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setAllSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = () => {
    try {
      let filteredSuppliers = [...allSuppliers];
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredSuppliers = filteredSuppliers.filter(supplier => {
          const name = supplier.name || '';
          const contactPerson = supplier.contactPerson || '';
          const phone = supplier.phone || '';
          const email = supplier.email || '';
          
          return (
            name.toLowerCase().includes(searchLower) ||
            contactPerson.toLowerCase().includes(searchLower) ||
            phone.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Status filter
      if (selectedStatus) {
        const isActive = selectedStatus === 'active';
        filteredSuppliers = filteredSuppliers.filter(supplier => supplier.isActive === isActive);
      }
      
      // Date range filter
      if (startDate || endDate) {
        filteredSuppliers = filteredSuppliers.filter(supplier => {
          const supplierDate = new Date(supplier.createdAt || supplier.date);
          if (startDate && supplierDate < new Date(startDate)) return false;
          if (endDate && supplierDate > new Date(endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Calculate pagination
      const total = filteredSuppliers.length;
      const totalPages = Math.ceil(total / itemsPerPage) || 1;
      setPagination({ 
        current: currentPage, 
        pages: totalPages, 
        total: total 
      });
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);
      
      setSuppliers(paginatedSuppliers);
    } catch (error) {
      console.error('Error applying filters:', error);
      setSuppliers([]);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      page: 1,
      limit: 10
    });
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
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
        fetchAllSuppliers();
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
        <Loading message="Loading suppliers..." size="medium" />
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
              Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Search and Filters */}
        <SearchAndFilters
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          showClientFilter={false}
          states={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          selectedState={selectedStatus}
          onStateChange={setSelectedStatus}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
          searchPlaceholder="Search by supplier or contact person name..."
        />

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
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.current}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => handlePageChange(page)}
            />
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