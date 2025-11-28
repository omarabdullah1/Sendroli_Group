import { useEffect, useState } from 'react';
import PurchaseOrderForm from '../components/Purchases/PurchaseOrderForm';
import { useAuth } from '../context/AuthContext';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import SearchAndFilters from '../components/SearchAndFilters';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import './Purchases.css';

const Purchases = () => {
  const [allPurchases, setAllPurchases] = useState([]); // Store all fetched purchases
  const [purchases, setPurchases] = useState([]); // Displayed purchases (filtered + paginated)
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplier: '',
    page: 1,
    limit: 10
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchAllPurchases(),
      fetchSuppliers()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.search, filters.status, filters.supplier, startDate, endDate]);

  useEffect(() => {
    applyFiltersAndPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPurchases, filters, startDate, endDate, currentPage]);

  // Fetch all purchases once
  const fetchAllPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getAll({ limit: 10000 });
      setAllPurchases(response.data.data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setAllPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = () => {
    try {
      let filteredPurchases = [...allPurchases];
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredPurchases = filteredPurchases.filter(purchase => {
          const purchaseNumber = purchase.purchaseNumber || '';
          const supplierName = purchase.supplier?.name || '';
          return (
            purchaseNumber.toLowerCase().includes(searchLower) ||
            supplierName.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Status filter
      if (filters.status) {
        filteredPurchases = filteredPurchases.filter(purchase => 
          purchase.status === filters.status
        );
      }
      
      // Supplier filter
      if (filters.supplier) {
        filteredPurchases = filteredPurchases.filter(purchase => 
          purchase.supplier?._id === filters.supplier || purchase.supplier === filters.supplier
        );
      }
      
      // Date range filter
      if (startDate || endDate) {
        filteredPurchases = filteredPurchases.filter(purchase => {
          const purchaseDate = new Date(purchase.createdAt || purchase.date || purchase.orderDate);
          if (startDate && purchaseDate < new Date(startDate)) return false;
          if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Calculate pagination
      const total = filteredPurchases.length;
      const totalPages = Math.ceil(total / itemsPerPage) || 1;
      setPagination({ 
        current: currentPage, 
        pages: totalPages, 
        total: total 
      });
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);
      
      setPurchases(paginatedPurchases);
    } catch (error) {
      console.error('Error applying filters:', error);
      setPurchases([]);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      supplier: '',
      page: 1,
      limit: 10
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'ordered': return '#3b82f6';
      case 'received': return '#10b981';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-EG');
  };

  const handleCreatePurchase = () => {
    setEditingPurchase(null);
    setShowForm(true);
  };

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPurchase(null);
  };

  const handleSubmitPurchase = async (purchaseData) => {
    try {
      if (editingPurchase) {
        await purchaseService.update(editingPurchase._id, purchaseData);
      } else {
        await purchaseService.create(purchaseData);
      }
      
      setShowForm(false);
      setEditingPurchase(null);
      fetchAllPurchases(); // Refresh the list
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const handleStatusUpdate = async (purchaseId, newStatus) => {
    const confirmMessages = {
      'ordered': 'Are you sure you want to mark this purchase order as ordered? This means the order has been placed with the supplier.',
      'received': 'Are you sure you want to mark this purchase order as received? This means all materials have been delivered.',
      'cancelled': 'Are you sure you want to cancel this purchase order? This action cannot be undone.'
    };

    if (!window.confirm(confirmMessages[newStatus])) {
      return;
    }

    try {
      await purchaseService.update(purchaseId, { status: newStatus });
      fetchAllPurchases(); // Refresh the list
    } catch (error) {
      console.error('Error updating purchase status:', error);
    }
  };

  const handleDeletePurchase = async (purchaseId, purchaseNumber) => {
    const confirmMessage = `Are you sure you want to delete purchase order ${purchaseNumber}? This action cannot be undone and will permanently remove the purchase order from the system.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await purchaseService.delete(purchaseId);
      fetchAllPurchases(); // Refresh the list
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase order. Please try again.');
    }
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="purchases-page">
        <Loading message="Loading purchases..." />
      </div>
    );
  }

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Purchase Orders</h1>
            <p>Manage purchase orders and track deliveries</p>
          </div>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={handleCreatePurchase}>
              New Purchase Order
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Search and Filters */}
        <SearchAndFilters
          searchValue={filters.search}
          onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value, page: 1 }))}
          clients={suppliers.map(s => ({ _id: s._id, name: s.name }))} // Map suppliers as clients for the component
          selectedClient={filters.supplier}
          onClientChange={(value) => setFilters(prev => ({ ...prev, supplier: value, page: 1 }))}
          states={[
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'ordered', label: 'Ordered' },
            { value: 'received', label: 'Received' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          selectedState={filters.status}
          onStateChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
          searchPlaceholder="Search by purchase number..."
        />

        <div className="purchases-table-section">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Expected Delivery</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase._id}>
                    <td className="purchase-number">{purchase.purchaseNumber}</td>
                    <td>{purchase.supplier?.name}</td>
                    <td>{formatDate(purchase.orderDate)}</td>
                    <td className="amount">{formatCurrency(purchase.totalAmount)}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(purchase.status) }}
                      >
                        {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {purchase.expectedDelivery ? formatDate(purchase.expectedDelivery) : 'TBD'}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="actions">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditPurchase(purchase)}
                        >
                          View
                        </button>
                        
                        {/* Status-based action buttons */}
                        {purchase.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleStatusUpdate(purchase._id, 'ordered')}
                            >
                              Mark as Ordered
                            </button>
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => handleStatusUpdate(purchase._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeletePurchase(purchase._id, purchase.purchaseNumber)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        
                        {purchase.status === 'ordered' && (
                          <>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleStatusUpdate(purchase._id, 'received')}
                            >
                              Mark as Received
                            </button>
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => handleStatusUpdate(purchase._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        
                        {purchase.status === 'cancelled' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeletePurchase(purchase._id, purchase.purchaseNumber)}
                          >
                            Delete
                          </button>
                        )}
                        
                        {purchase.status === 'received' && (
                          <span className="status-final">
                            Completed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {purchases.length === 0 && (
            <div className="empty-state">
              {/* Empty state icon removed for unified design */}
              <h3>No purchase orders found</h3>
              <p>Start by creating your first purchase order.</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && purchases.length > 0 && (
            <Pagination
              currentPage={pagination.current || currentPage}
              totalPages={pagination.pages || 1}
              totalItems={pagination.total || purchases.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Purchase Order Form Modal */}
      {showForm && (
        <PurchaseOrderForm
          purchase={editingPurchase}
          onSubmit={handleSubmitPurchase}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Purchases;