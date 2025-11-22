import { useEffect, useState } from 'react';
import PurchaseOrderForm from '../components/Purchases/PurchaseOrderForm';
import { useAuth } from '../context/AuthContext';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import './Purchases.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplier: '',
    page: 1,
    limit: 10
  });
  
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchPurchases(),
      fetchSuppliers()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPurchases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getAll(filters);
      setPurchases(response.data.data.purchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
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
      fetchPurchases(); // Refresh the list
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
      fetchPurchases(); // Refresh the list
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
      fetchPurchases(); // Refresh the list
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase order. Please try again.');
    }
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="purchases-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading purchases...</p>
        </div>
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
              <i className="icon-plus"></i> New Purchase Order
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Purchase Orders</label>
              <input
                type="text"
                placeholder="Search by purchase number..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="search-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value, page: 1 }))}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
              <div className="empty-icon">📦</div>
              <h3>No purchase orders found</h3>
              <p>Start by creating your first purchase order.</p>
            </div>
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