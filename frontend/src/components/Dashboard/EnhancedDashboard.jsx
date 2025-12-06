import {
    faBox,
    faChartLine,
    faCheckCircle,
    faClock,
    faDollarSign,
    faExclamationTriangle,
    faPalette,
    faRotate,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientService from '../../services/clientService';
import { materialService } from '../../services/materialService';
import orderService from '../../services/orderService';
import Loading from '../Loading';
import PageLoader from '../PageLoader';
import './EnhancedDashboard.css';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalClients: 0,
      totalMaterials: 0,
      pendingOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
    },
    recentOrders: [],
    statusBreakdown: [],
    lowStockMaterials: [],
    recentActivity: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = {
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          totalClients: 0,
          totalMaterials: 0,
          pendingOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
        },
        recentOrders: [],
        statusBreakdown: [],
        lowStockMaterials: [],
      };

      // Load order stats for roles that can access them
      if (['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
        try {
          const orderStats = await orderService.getFinancialStats();
          data.stats.totalOrders = orderStats.data?.overall?.totalOrders || 0;
          data.stats.totalRevenue = orderStats.data?.overall?.totalRevenue || 0;
          data.statusBreakdown = orderStats.data?.byState || [];
          
          // Calculate status counts
          data.statusBreakdown.forEach((status) => {
            if (status._id === 'pending') data.stats.pendingOrders = status.count;
            if (status._id === 'active') data.stats.activeOrders = status.count;
            if (status._id === 'done' || status._id === 'delivered') {
              data.stats.completedOrders += status.count;
            }
          });

          // Get recent orders
          const ordersResponse = await orderService.getOrders();
          data.recentOrders = (ordersResponse.data || []).slice(0, 5);
        } catch (error) {
          console.error('Error loading order stats:', error);
        }
      }

      // Load client count for receptionist and admin
      if (['receptionist', 'admin'].includes(user?.role)) {
        try {
          const clients = await clientService.getClients();
          data.stats.totalClients = Array.isArray(clients) ? clients.length : clients.data?.length || 0;
        } catch (error) {
          console.error('Error loading clients:', error);
        }
      }

      // Load materials and inventory for admin
      if (user?.role === 'admin') {
        try {
          const materialsResponse = await materialService.getAll({ limit: 10000 });
          const materials = materialsResponse.data.data.materials || [];
          data.stats.totalMaterials = materials.length || 0;
          
          // Find low stock materials
          data.lowStockMaterials = materials
            .filter((material) => material.currentStock <= material.minStockLevel)
            .slice(0, 5);
        } catch (error) {
          console.error('Error loading materials:', error);
        }
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'info',
      done: 'success',
      delivered: 'success',
    };
    return colors[status] || 'info';
  };

  // Helper function to render KPI icon (supports both image and Font Awesome icon)
  const renderKPIIcon = (icon, image, gradient) => {
    if (image) {
      return (
        <div className="kpi-icon" style={{ background: gradient }}>
          <img src={image} alt="KPI" className="kpi-image" />
        </div>
      );
    }
    return (
      <div className="kpi-icon" style={{ background: gradient }}>
        <FontAwesomeIcon icon={icon} className="kpi-fa-icon" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Loading message="Loading dashboard..." size="large" />
      </div>
    );
  }

  // Return content wrapped in PageLoader
  return (
    <PageLoader
      loading={loading}
      loadingMessage="Loading dashboard data..."
      onLoadComplete={() => console.log('Dashboard loaded')}
    >
      <div className="enhanced-dashboard">
        {/* Welcome Header */}
        <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">
            Welcome back, {user?.fullName || user?.username}
          </h1>
          <p className="dashboard-subtitle">Track and manage your operations.</p>
        </div>
        <div className="header-actions">
          <button className="action-button">
            This month
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="action-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Import
          </button>
          {['admin', 'receptionist'].includes(user?.role) && (
            <Link to="/clients/new" className="action-button primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add User
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {['designer', 'worker', 'financial', 'admin'].includes(user?.role) && (
          <>
            <div className="kpi-card">
              {renderKPIIcon(faChartLine, null, 'linear-gradient(135deg, #00CED1, #0099CC)')}
              <div className="kpi-content">
                <span className="kpi-label">Total Orders</span>
                <span className="kpi-value">{dashboardData.stats.totalOrders}</span>
                <span className="kpi-trend positive">
                  <span className="trend-icon">+20%</span> v/s Last Month
                </span>
              </div>
            </div>

            <div className="kpi-card">
              {renderKPIIcon(faClock, null, 'linear-gradient(135deg, #FF6B35, #FF6B9D)')}
              <div className="kpi-content">
                <span className="kpi-label">Pending Orders</span>
                <span className="kpi-value">{dashboardData.stats.pendingOrders}</span>
                <span className="kpi-trend">
                  Awaiting Processing
                </span>
              </div>
            </div>

            <div className="kpi-card">
              {renderKPIIcon(faRotate, null, 'linear-gradient(135deg, #20E0E3, #00CED1)')}
              <div className="kpi-content">
                <span className="kpi-label">Active Orders</span>
                <span className="kpi-value">{dashboardData.stats.activeOrders}</span>
                <span className="kpi-trend positive">
                  <span className="trend-icon">+20%</span> v/s Last Month
                </span>
              </div>
            </div>

            <div className="kpi-card">
              {renderKPIIcon(faCheckCircle, null, 'linear-gradient(135deg, #00CED1, #20E0E3)')}
              <div className="kpi-content">
                <span className="kpi-label">Completed</span>
                <span className="kpi-value">{dashboardData.stats.completedOrders}</span>
                <span className="kpi-trend positive">
                  <span className="trend-icon">↑</span> Done & Delivered
                </span>
              </div>
            </div>
          </>
        )}

        {['financial', 'admin'].includes(user?.role) && (
          <div className="kpi-card featured">
            {renderKPIIcon(faDollarSign, null, 'linear-gradient(135deg, #FF6B35, #FF6B9D)')}
            <div className="kpi-content">
              <span className="kpi-label">Total Revenue</span>
              <span className="kpi-value">{dashboardData.stats.totalRevenue.toFixed(2)} EGP</span>
              <span className="kpi-trend positive">
                <span className="trend-icon">↑</span> Overall Earnings
              </span>
            </div>
          </div>
        )}

        {['receptionist', 'admin'].includes(user?.role) && (
          <div className="kpi-card">
            {renderKPIIcon(faUsers, null, 'linear-gradient(135deg, #20E0E3, #00CED1)')}
            <div className="kpi-content">
              <span className="kpi-label">Total Clients</span>
              <span className="kpi-value">{dashboardData.stats.totalClients}</span>
              <span className="kpi-trend positive">
                <span className="trend-icon">+20%</span> v/s Last Month
              </span>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="kpi-card">
            {renderKPIIcon(faPalette, null, 'linear-gradient(135deg, #4A90E2, #00CED1)')}
            <div className="kpi-content">
              <span className="kpi-label">Materials</span>
              <span className="kpi-value">{dashboardData.stats.totalMaterials}</span>
              <span className="kpi-trend">
                In Inventory
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Orders */}
        {dashboardData.recentOrders.length > 0 && (
          <div className="dashboard-card recent-orders">
            <div className="card-header">
              <h2 className="card-title"><FontAwesomeIcon icon={faBox} /> Recent Orders</h2>
              <Link to="/orders" className="view-all-link">
                View All →
              </Link>
            </div>
            <div className="card-body">
              <div className="orders-list">
                {dashboardData.recentOrders.map((order) => (
                  <div key={order._id} className="order-item">
                    <div className="order-info">
                      <span className="order-client">{order.client?.name || order.clientName || 'N/A'}</span>
                      <span className="order-type">{order.type || 'General Order'}</span>
                    </div>
                    <div className="order-meta">
                      <span className={`badge badge-${getStatusColor(order.orderState)}`}>
                        {order.orderState}
                      </span>
                      <span className="order-price">{order.totalPrice?.toFixed(2) || 0} EGP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown Chart */}
        {dashboardData.statusBreakdown.length > 0 && (
          <div className="dashboard-card status-chart">
            <div className="card-header">
              <h2 className="card-title">📈 Order Status Distribution</h2>
            </div>
            <div className="card-body">
              <div className="status-bars">
                {dashboardData.statusBreakdown.map((status) => {
                  const percentage = (status.count / dashboardData.stats.totalOrders) * 100;
                  return (
                    <div key={status._id} className="status-bar-item">
                      <div className="status-bar-label">
                        <span className="status-name">{status._id}</span>
                        <span className="status-count">{status.count} orders</span>
                      </div>
                      <div className="status-bar-track">
                        <div
                          className={`status-bar-fill status-${status._id}`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="bar-percentage">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {user?.role === 'admin' && dashboardData.lowStockMaterials.length > 0 && (
          <div className="dashboard-card low-stock-alert">
            <div className="card-header">
              <h2 className="card-title"><FontAwesomeIcon icon={faExclamationTriangle} /> Low Stock Alert</h2>
              <Link to="/inventory" className="view-all-link">
                Manage →
              </Link>
            </div>
            <div className="card-body">
              <div className="stock-list">
                {dashboardData.lowStockMaterials.map((material) => (
                  <div key={material._id} className="stock-item">
                    <div className="stock-info">
                      <span className="stock-name">{material.name}</span>
                      <span className="stock-warning">
                        Current: {material.currentStock} {material.unit} | Min: {material.minStockLevel} {material.unit}
                      </span>
                    </div>
                    <span className="badge badge-error">Low Stock</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <h2 className="card-title">⚡ Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="action-grid">
              {user?.role === 'admin' && (
                <>
                  <Link to="/invoices/new" className="action-card">
                    <span className="action-label">New Invoice</span>
                  </Link>
                  <Link to="/clients/new" className="action-card">
                    <span className="action-label">Add Client</span>
                  </Link>
                  <Link to="/materials" className="action-card">
                    <span className="action-label">Materials</span>
                  </Link>
                  <Link to="/purchases/new" className="action-card">
                    <span className="action-label">New Purchase</span>
                  </Link>
                </>
              )}
              {user?.role === 'receptionist' && (
                <>
                  <Link to="/clients/new" className="action-card">
                    <span className="action-label">Add Client</span>
                  </Link>
                  <Link to="/clients" className="action-card">
                    <span className="action-label">View Clients</span>
                  </Link>
                </>
              )}
              {['designer', 'worker'].includes(user?.role) && (
                <>
                  <Link to="/invoices" className="action-card">
                    <span className="action-label">View Invoices</span>
                  </Link>
                  <Link to="/orders" className="action-card">
                    <span className="action-label">View Orders</span>
                  </Link>
                </>
              )}
              {user?.role === 'financial' && (
                <>
                  <Link to="/invoices" className="action-card">
                    <span className="action-label">View Invoices</span>
                  </Link>
                  <Link to="/financial-stats" className="action-card">
                    <span className="action-label">Financial Reports</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageLoader>
  );
};

export default EnhancedDashboard;

