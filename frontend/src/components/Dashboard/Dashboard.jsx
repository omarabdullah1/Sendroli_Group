import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { clientService } from '../../services/clientService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    statusBreakdown: [],
  });
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [orderStats, clients] = await Promise.all([
        orderService.getOrderStats(),
        clientService.getClients(),
      ]);
      setStats(orderStats);
      setTotalClients(clients.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.username}!</h1>
      <p className="role-badge">Role: {user?.role}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
          <Link to="/orders" className="stat-link">
            View Orders
          </Link>
        </div>
        <div className="stat-card">
          <h3>Total Clients</h3>
          <p className="stat-value">{totalClients}</p>
          <Link to="/clients" className="stat-link">
            View Clients
          </Link>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${stats.totalRevenue?.toFixed(2) || 0}</p>
        </div>
      </div>

      <div className="status-breakdown">
        <h2>Orders by Status</h2>
        <div className="status-grid">
          {stats.statusBreakdown?.map((status) => (
            <div key={status._id} className="status-card">
              <h4>{status._id}</h4>
              <p>Count: {status.count}</p>
              <p>Total: ${status.totalAmount?.toFixed(2) || 0}</p>
              <p>Balance: ${status.totalBalance?.toFixed(2) || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/clients/new" className="action-btn">
            Add New Client
          </Link>
          <Link to="/orders/new" className="action-btn">
            Create New Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
