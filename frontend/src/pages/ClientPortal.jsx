import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import './ClientPortal.css';

const ClientPortal = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'active': return '#3b82f6';
      case 'done': return '#10b981';
      case 'delivered': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="client-portal-container">
      <div className="client-portal-header">
        <div className="portal-logo">
          <Logo variant="full" size="medium" alt="Sendroli Group" />
        </div>
        <div className="portal-user-info">
          <span>Welcome, {user?.fullName || user?.username}</span>
          <button onClick={handleLogout} className="portal-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="client-portal-content">
        <div className="portal-dashboard">
          <h1>My Orders</h1>
          
          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="no-orders">
              <p>You don't have any orders yet.</p>
            </div>
          ) : (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Total Price</th>
                    <th>Remaining</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6).toUpperCase()}</td>
                      <td>{order.type}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(order.orderState) }}>
                          {order.orderState}
                        </span>
                      </td>
                      <td>{order.totalPrice} EGP</td>
                      <td>{order.remainingAmount} EGP</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="portal-footer">
        <p>&copy; {new Date().getFullYear()} Sendroli Group. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ClientPortal;
