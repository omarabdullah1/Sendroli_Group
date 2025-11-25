import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';
import orderService from '../services/orderService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const canEditStatus = user?.role === 'designer' || user?.role === 'admin';

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      // response is already the data object from backend: { success, data: [...orders], totalPages, etc }
      setOrders(response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!canEditStatus) return;
    try {
      await orderService.updateOrder(orderId, { orderState: newStatus });
      fetchOrders();
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
      fetchOrders();
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
        fetchOrders();
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
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update design information');
    }
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
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Order Management</h1>
          {canAdd && (
            <button onClick={() => setShowForm(true)} style={styles.addButton}>
              Add New Order
            </button>
          )}
        </div>

        {showForm && (
          <div style={styles.formOverlay}>
            <div style={styles.formContainer}>
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
          <div style={styles.formOverlay}>
            <div style={styles.formContainer}>
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
          <div style={styles.loading}>Loading...</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Sheet Size</th>
                  <th style={styles.th}>Repeats</th>
                  <th style={styles.th}>Total Price</th>
                  <th style={styles.th}>Deposit</th>
                  <th style={styles.th}>Remaining</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Notes</th>
                  {(user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin') && (
                    <th style={styles.th}>Design Link</th>
                  )}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin' ? "11" : "10"} style={styles.noData}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td style={styles.td}>
                        {order.client?.name || order.clientSnapshot?.name}
                      </td>
                      <td style={styles.td}>{order.type || '-'}</td>
                      <td style={styles.td}>{order.sheetSize || '-'}</td>
                      <td style={styles.td}>{order.repeats || 0}</td>
                      <td style={styles.td}>{order.totalPrice} EGP</td>
                      <td style={styles.td}>{order.deposit} EGP</td>
                      <td style={styles.td}>{order.remainingAmount} EGP</td>
                      <td style={styles.td}>
                        <span style={getStatusStyle(order.orderState || 'pending')}>
                          {order.orderState || 'pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.notesCell}>
                          {order.notes ? (
                            <span title={order.notes}>
                              {order.notes.length > 30 ? `${order.notes.substring(0, 30)}...` : order.notes}
                            </span>
                          ) : (
                            <span style={{color: '#95a5a6', fontStyle: 'italic'}}>No notes</span>
                          )}
                        </div>
                      </td>
                      {(user?.role === 'designer' || user?.role === 'worker' || user?.role === 'admin') && (
                        <td style={styles.td}>
                          {order.designLink ? (
                            <a 
                              href={order.designLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={styles.designLinkButton}
                            >
                              View Design
                            </a>
                          ) : (
                            <span style={{color: '#95a5a6', fontStyle: 'italic'}}>No link</span>
                          )}
                        </td>
                      )}
                      <td style={styles.td}>
                        {canEditStatus && (
                          <select
                            value={order.orderState}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            style={styles.select}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="done">Done</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        )}
                        {user?.role === 'designer' && (
                          <button onClick={() => handleDesignUpdate(order)} style={styles.designButton}>
                            Design
                          </button>
                        )}
                        {canEdit && user?.role !== 'designer' && (
                          <button onClick={() => handleEdit(order)} style={styles.editButton}>
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(order._id)} style={styles.deleteButton}>
                            Delete
                          </button>
                        )}
                        {!canEditStatus && !canEdit && !canDelete && user?.role !== 'designer' && (
                          <span style={{color: '#7f8c8d', fontStyle: 'italic'}}>View Only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
    backgroundColor: '#ecf0f1',
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
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
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
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  formTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
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
    color: '#2c3e50',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
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
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
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
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #ecf0f1',
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '0.9rem',
    marginRight: '0.5rem',
  },
  designButton: {
    backgroundColor: '#9b59b6',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  designLinkButton: {
    backgroundColor: '#8e44ad',
    color: '#fff',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'inline-block',
    transition: 'background-color 0.2s',
  },
  editButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  notesCell: {
    maxWidth: '200px',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default Orders;
