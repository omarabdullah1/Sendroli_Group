import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import './Orders.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const filters = filter ? { status: filter } : {};
      const data = await orderService.getOrders(filters);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await orderService.deleteOrder(id);
      setOrders(orders.filter((order) => order._id !== id));
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="order-list">
      <div className="list-header">
        <h1>Orders</h1>
        <Link to="/orders/new" className="btn-primary">
          Create New Order
        </Link>
      </div>

      <div className="filter-bar">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found. Create your first order!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Size</th>
                <th>Repeats</th>
                <th>Price</th>
                <th>Deposit</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.client?.name || 'N/A'}</td>
                  <td>{order.type}</td>
                  <td>{order.size}</td>
                  <td>{order.repeats}</td>
                  <td>${order.price}</td>
                  <td>${order.deposit}</td>
                  <td>${order.balance}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/orders/${order._id}`} className="btn-view">
                      View
                    </Link>
                    <Link to={`/orders/edit/${order._id}`} className="btn-edit">
                      Edit
                    </Link>
                    {(user?.role === 'Admin' || user?.role === 'Financial') && (
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderList;
