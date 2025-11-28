import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import SearchAndFilters from '../components/SearchAndFilters';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';
import orderService from '../services/orderService';
import { formatDateTime } from '../utils/dateUtils';
import './Orders.css';

const Orders = () => {
  const [allOrders, setAllOrders] = useState([]); // Store all fetched orders
  const [orders, setOrders] = useState([]); // Displayed orders (filtered + paginated)
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [designOrder, setDesignOrder] = useState(null);
  const [designFormData, setDesignFormData] = useState({
    orderState: 'pending',
    designLink: '',
  });
  const [formData, setFormData] = useState({
    client: '',
    type: '',
    repeats: 0,
    sheetSize: '',
    totalPrice: 0,
    deposit: 0,
    orderState: 'pending',
    notes: '',
  });
  const { user, loading: authLoading } = useAuth();

  // Role-based permissions
  const canEdit = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'designer';
  const canDelete = user?.role === 'admin';
  const canAdd = user?.role === 'admin' || user?.role === 'receptionist';
  const canEditStatus = user?.role === 'designer' || user?.role === 'admin' || user?.role === 'worker';

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [allOrders, searchTerm, selectedClient, selectedState, startDate, endDate, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedClient, selectedState, startDate, endDate]);

  // Show loading if user is not loaded yet (moved after hooks)
  if (authLoading || !user) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          {authLoading ? 'Loading user information...' : 'Please log in to access orders'}
        </div>
      </div>
    );
  }

  const fetchClients = async () => {
    try {
      const response = await clientService.getClients();
      // response is { success, data: [...clients], totalPages, etc }
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setClients([]); // Set empty array on error
    }
  };

  // Fetch all orders once (without filters, get a large batch)
  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      // Fetch with a large limit to get all or most orders
      const response = await orderService.getOrders({ limit: 10000 });
      setAllOrders(response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = () => {
    try {
      let filteredOrders = [...allOrders];
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order => {
          const clientName = order.client?.name || order.clientSnapshot?.name || '';
          const clientPhone = order.client?.phone || order.clientSnapshot?.phone || '';
          const factoryName = order.client?.factoryName || order.clientSnapshot?.factoryName || '';
          const orderType = order.type || '';
          
          return (
            clientName.toLowerCase().includes(searchLower) ||
            clientPhone.toLowerCase().includes(searchLower) ||
            factoryName.toLowerCase().includes(searchLower) ||
            orderType.toLowerCase().includes(searchLower) ||
            order._id?.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Client filter
      if (selectedClient) {
        filteredOrders = filteredOrders.filter(order => 
          order.client?._id === selectedClient || order.client === selectedClient
        );
      }
      
      // State filter
      if (selectedState) {
        filteredOrders = filteredOrders.filter(order => 
          order.orderState === selectedState
        );
      }
      
      // Date range filter
      if (startDate || endDate) {
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt || order.date);
          if (startDate && orderDate < new Date(startDate)) return false;
          if (endDate && orderDate > new Date(endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Calculate pagination
      const total = filteredOrders.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      setOrders(paginatedOrders);
    } catch (err) {
      console.error('Error applying filters:', err);
      setOrders([]);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!canEditStatus) return;
    try {
      await orderService.updateOrder(orderId, { orderState: newStatus });
      fetchAllOrders(); // Reload all data
    } catch (err) {
      // Enhanced error message with material stock details if available
      let errorMessage = err.response?.data?.message || 'Failed to update order';
      
      if (err.response?.data?.materialInfo) {
        const info = err.response.data.materialInfo;
        errorMessage += `\n\n📦 Material Stock Details:`;
        errorMessage += `\n• Material: ${info.name}`;
        errorMessage += `\n• Required: ${info.required.toFixed(2)} ${info.unit}`;
        errorMessage += `\n• Available: ${info.available.toFixed(2)} ${info.unit}`;
        errorMessage += `\n• Shortage: ${info.shortage.toFixed(2)} ${info.unit}`;
        errorMessage += `\n• Stock Status: ${info.status}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd && !editingOrder) return;
    if (!canEdit && editingOrder) return;

    try {
      if (editingOrder) {
        await orderService.updateOrder(editingOrder._id, formData);
      } else {
        await orderService.createOrder(formData);
      }
      setShowForm(false);
      setEditingOrder(null);
      setFormData({
        client: '',
        type: '',
        repeats: 0,
        sheetSize: '',
        totalPrice: 0,
        deposit: 0,
        orderState: 'pending',
        notes: '',
      });
      fetchAllOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (order) => {
    if (!canEdit) return;
    setEditingOrder(order);
    setFormData({
      client: order.client?._id || order.client || '',
      type: order.type || '',
      repeats: order.repeats || 0,
      sheetSize: order.sheetSize || '',
      totalPrice: order.totalPrice || 0,
      deposit: order.deposit || 0,
      orderState: order.orderState || 'pending',
      notes: order.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (orderId) => {
    if (!canDelete) return;
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderService.deleteOrder(orderId);
        fetchAllOrders();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  const handleDesignUpdate = (order) => {
    if (user?.role !== 'designer') return;
    setDesignOrder(order);
    setDesignFormData({
      orderState: order.orderState || 'pending',
      designLink: order.designLink || '',
    });
    setShowDesignModal(true);
  };

  const handleDesignSubmit = async (e) => {
    e.preventDefault();
    if (!designOrder) return;

    try {
      await orderService.updateOrder(designOrder._id, designFormData);
      setShowDesignModal(false);
      setDesignOrder(null);
      fetchAllOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update design information');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedClient('');
    setSelectedState('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDesignCancel = () => {
    setShowDesignModal(false);
    setDesignOrder(null);
    setDesignFormData({
      orderState: 'pending',
      designLink: '',
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(null);
    setFormData({
      client: '',
      type: '',
      repeats: 0,
      sheetSize: '',
      totalPrice: 0,
      deposit: 0,
      orderState: 'pending',
      notes: '',
    });
  };

  return (
    <div style={styles.container} className="orders-container">
      <div style={styles.content}>
        <div style={styles.header} className="orders-header">
          <h1 style={styles.title}>Order Management</h1>
          {canAdd && (
            <button onClick={() => setShowForm(true)} style={styles.addButton}>
              Add New Order
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          states={[
            { value: '', label: 'All States' },
            { value: 'pending', label: 'Pending' },
            { value: 'active', label: 'Active' },
            { value: 'done', label: 'Done' },
            { value: 'delivered', label: 'Delivered' },
          ]}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
          searchPlaceholder="Search by client name, phone, or order number..."
        />

        {showForm && (
          <div style={styles.formOverlay} className="orders-form-overlay">
            <div style={styles.formContainer} className="orders-form-container">
              <h2 style={styles.formTitle}>
                {editingOrder ? 'Edit Order' : 'Add New Order'}
              </h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Client *</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Select a client</option>
                    {Array.isArray(clients) && clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} - {client.factoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Type *</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Repeats</label>
                  <input
                    type="number"
                    value={formData.repeats}
                    onChange={(e) => setFormData({ ...formData, repeats: parseInt(e.target.value) })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Sheet Size</label>
                  <select
                    value={formData.sheetSize}
                    onChange={(e) => setFormData({ ...formData, sheetSize: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Select Size</option>
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                    <option value="A1">A1</option>
                    <option value="A0">A0</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Price *</label>
                  <input
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Deposit</label>
                  <input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Order State</label>
                  <select
                    value={formData.orderState}
                    onChange={(e) => setFormData({ ...formData, orderState: e.target.value })}
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="done">Done</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={styles.textarea}
                    rows="3"
                  />
                </div>

                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitButton}>
                    {editingOrder ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDesignModal && (
          <div style={styles.formOverlay} className="orders-form-overlay">
            <div style={styles.formContainer} className="orders-form-container">
              <h2 style={styles.formTitle}>Update Design Information</h2>
              <form onSubmit={handleDesignSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Order Status *</label>
                  <select
                    value={designFormData.orderState}
                    onChange={(e) => setDesignFormData({ ...designFormData, orderState: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="done">Done</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Design Link</label>
                  <input
                    type="url"
                    value={designFormData.designLink}
                    onChange={(e) => setDesignFormData({ ...designFormData, designLink: e.target.value })}
                    placeholder="https://example.com/design-link"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitButton}>
                    Update Design
                  </button>
                  <button type="button" onClick={handleDesignCancel} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <Loading message="Loading orders..." size="medium" />
        ) : (
          <div className="orders-table-section">
            <div className="table-container">
              <table className="data-table orders-page-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Sheet Size</th>
                  <th>Repeats</th>
                  <th>Total Price</th>
                  <th>Deposit</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Notes</th>
                  {(user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin') && (
                    <th>Design Link</th>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin' ? "12" : "11"} className="no-data">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td>{formatDateTime(order.createdAt || order.date)}</td>
                      <td>
                        {order.client?.name || order.clientSnapshot?.name}
                      </td>
                      <td>{order.type || '-'}</td>
                      <td>{order.sheetSize || '-'}</td>
                      <td>{order.repeats || 0}</td>
                      <td>{order.totalPrice} EGP</td>
                      <td>{order.deposit} EGP</td>
                      <td>{order.remainingAmount} EGP</td>
                      <td>
                        <span className="status-badge" style={getStatusStyle(order.orderState || 'pending')}>
                          {order.orderState || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="notes-cell">
                          {order.notes ? (
                            <span title={order.notes}>
                              {order.notes.length > 30 ? `${order.notes.substring(0, 30)}...` : order.notes}
                            </span>
                          ) : (
                            <span className="no-notes">No notes</span>
                          )}
                        </div>
                      </td>
                      {(user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin') && (
                        <td>
                          {order.designLink ? (
                            <a 
                              href={order.designLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                            >
                              View Design
                            </a>
                          ) : (
                            <span className="no-link">No link</span>
                          )}
                        </td>
                      )}
                      <td className="actions">
                        <div className="orders-action-buttons">
                          {canEditStatus && (
                            <select
                              value={order.orderState}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              className="btn btn-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="done">Done</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          )}
                          {user?.role === 'designer' && (
                            <button onClick={() => handleDesignUpdate(order)} className="btn btn-sm btn-primary">
                              Design
                            </button>
                          )}
                          {canEdit && user?.role !== 'designer' && (
                            <button onClick={() => handleEdit(order)} className="btn btn-sm btn-secondary">
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(order._id)} className="btn btn-sm btn-danger">
                              Delete
                            </button>
                          )}
                          {!canEditStatus && !canEdit && !canDelete && user?.role !== 'designer' && (
                            <span className="view-only">View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

const getStatusStyle = (status) => {
  const baseStyle = {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  };

  const colors = {
    pending: { backgroundColor: '#fff3cd', color: '#856404' },
    active: { backgroundColor: '#cce5ff', color: '#004085' },
    done: { backgroundColor: '#d4edda', color: '#155724' },
    delivered: { backgroundColor: '#d1ecf1', color: '#0c5460' },
  };

  return { ...baseStyle, ...colors[status] };
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: 'var(--bg-primary, #f0fdfd)',
    padding: '2rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary, #111827)',
  },
  addButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formContainer: {
    backgroundColor: 'var(--surface, #fff)',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
  },
  formTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary, #111827)',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    color: 'var(--text-primary, #111827)',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '1rem',
    resize: 'vertical',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  submitButton: {
    flex: 1,
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'var(--gray-400, #9ca3af)',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
  tableContainer: {
    backgroundColor: 'var(--surface, #fff)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--border-light, #e5e7eb)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-light, #e5e7eb)',
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginRight: '0.5rem',
  },
  designButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  designLinkButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    backgroundColor: 'var(--error, #ef4444)',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  notesCell: {
    maxWidth: '200px',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default Orders;
