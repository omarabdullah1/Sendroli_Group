import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrder(orderId, { orderState: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    }
  };

  const canEditStatus = user.role === 'designer' || user.role === 'admin';
  const canEditPayment = user.role === 'financial' || user.role === 'admin';

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Order Management</h1>

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
                  <th style={styles.th}>Total Price</th>
                  <th style={styles.th}>Deposit</th>
                  <th style={styles.th}>Remaining</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={styles.noData}>
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
                      <td style={styles.td}>${order.totalPrice}</td>
                      <td style={styles.td}>${order.deposit}</td>
                      <td style={styles.td}>${order.remainingAmount}</td>
                      <td style={styles.td}>
                        <span style={getStatusStyle(order.orderState)}>
                          {order.orderState}
                        </span>
                      </td>
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
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '2rem',
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
  },
};

export default Orders;
