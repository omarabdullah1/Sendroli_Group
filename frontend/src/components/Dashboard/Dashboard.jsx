import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientService from '../../services/clientService';
import { orderService } from '../../services/orderService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    statusBreakdown: [],
  });
  const [totalClients, setTotalClients] = useState(0);
  const [clientStats, setClientStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load data based on user role
      const promises = [];
      
      // All roles with order access can see order stats
      if (['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
        try {
          promises.push(orderService.getFinancialStats());
        } catch (error) {
          console.error('Error loading order stats:', error);
          promises.push(Promise.resolve({ 
            data: { 
              overall: { totalOrders: 0, totalRevenue: 0 },
              byState: [] 
            }
          }));
        }
      } else {
        promises.push(Promise.resolve({ 
          data: { 
            overall: { totalOrders: 0, totalRevenue: 0 },
            byState: [] 
          }
        }));
      }
      
      // Only receptionist and admin can access clients
      if (['receptionist', 'admin'].includes(user?.role)) {
        try {
          promises.push(clientService.getClients());
        } catch (error) {
          console.error('Error loading clients:', error);
          promises.push(Promise.resolve([]));
        }
      } else {
        promises.push(Promise.resolve([]));
      }

      // Load client statistics for financial and admin roles
      if (['financial', 'admin', 'receptionist'].includes(user?.role)) {
        try {
          promises.push(clientService.getClientsStatistics());
        } catch (error) {
          console.error('Error loading client statistics:', error);
          promises.push(Promise.resolve(null));
        }
      } else {
        promises.push(Promise.resolve(null));
      }

      const results = await Promise.all(promises);
      
      // Handle order stats for roles that should see them
      if (['designer', 'worker', 'financial', 'admin'].includes(user?.role)) {
        const orderStatsIndex = ['receptionist', 'admin'].includes(user?.role) ? 0 : 0;
        const orderStats = results[orderStatsIndex]?.data || { overall: { totalOrders: 0, totalRevenue: 0 }, byState: [] };
        setStats({
          totalOrders: orderStats.overall?.totalOrders || 0,
          totalRevenue: orderStats.overall?.totalRevenue || 0,
          statusBreakdown: orderStats.byState || []
        });
      }
      
      // Handle client data for roles that should see them
      if (['receptionist', 'admin'].includes(user?.role)) {
        const clientsIndex = ['designer', 'worker', 'financial', 'admin'].includes(user?.role) ? 1 : 0;
        const clients = results[clientsIndex] || [];
        setTotalClients(Array.isArray(clients) ? clients.length : 0);
      }

      // Handle client statistics
      if (['financial', 'admin', 'receptionist'].includes(user?.role)) {
        const clientStatsIndex = ['receptionist', 'admin'].includes(user?.role) ? 2 : 
                                 ['designer', 'worker', 'financial', 'admin'].includes(user?.role) ? 2 : 0;
        const clientStatsData = results[clientStatsIndex];
        console.log('Dashboard - User role:', user?.role);
        console.log('Dashboard - Client stats data:', clientStatsData);
        console.log('Dashboard - Has data?:', clientStatsData?.data);
        console.log('Dashboard - Overall stats:', clientStatsData?.data?.overallStats);
        if (clientStatsData?.data) {
          setClientStats(clientStatsData.data);
          console.log('Dashboard - Client stats set:', clientStatsData.data);
        }
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
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
        {/* Show order stats for roles that can access orders */}
        {['designer', 'worker', 'financial', 'admin'].includes(user?.role) && (
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.totalOrders}</p>
            <Link to="/orders" className="stat-link">
              View Orders
            </Link>
          </div>
        )}
        
        {/* Show client stats only for roles that can access clients */}
        {['receptionist', 'admin'].includes(user?.role) && (
          <div className="stat-card">
            <h3>Total Clients</h3>
            <p className="stat-value">{totalClients}</p>
            <Link to="/clients" className="stat-link">
              View Clients
            </Link>
          </div>
        )}
        
        {/* Show revenue for financial roles */}
        {['financial', 'admin'].includes(user?.role) && (
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">{stats.totalRevenue?.toFixed(2) || 0} EGP</p>
          </div>
        )}
      </div>

      {/* Show order status breakdown for roles that can access orders */}
      {['designer', 'worker', 'financial', 'admin'].includes(user?.role) && stats.statusBreakdown?.length > 0 && (
        <div className="status-breakdown">
          <h2>Orders by Status</h2>
          <div className="status-grid">
            {stats.statusBreakdown.map((status) => (
              <div key={status._id} className="status-card">
                <h4>{status._id}</h4>
                <p>Count: {status.count}</p>
                <p>Total: {status.totalValue?.toFixed(2) || 0} EGP</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Analytics Summary for authorized roles */}
      {['financial', 'admin', 'receptionist'].includes(user?.role) && clientStats && (
        <div className="client-analytics-summary">
          {console.log('Rendering client analytics - clientStats:', clientStats)}
          {console.log('Rendering client analytics - overallStats:', clientStats.overallStats)}
          {console.log('Rendering client analytics - topPayingClients:', clientStats.overallStats?.topPayingClients)}
          {console.log('Rendering client analytics - mostLoyalClient:', clientStats.overallStats?.mostLoyalClient)}
          {console.log('Rendering client analytics - clients array:', clientStats.clients)}
          <div className="section-header">
            <h2>Client Analytics Overview</h2>
            <Link to="/clients/analytics" className="view-full-report-link">
              View Full Report →
            </Link>
          </div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Client Revenue</h4>
              <p className="analytics-value">{formatCurrency(clientStats.overallStats.totalRevenue)}</p>
            </div>
            <div className="analytics-card">
              <h4>Total Paid</h4>
              <p className="analytics-value success">{formatCurrency(clientStats.overallStats.totalPaid)}</p>
              <small>
                {((clientStats.overallStats.totalPaid / clientStats.overallStats.totalRevenue) * 100).toFixed(1)}% collected
              </small>
            </div>
            <div className="analytics-card">
              <h4>Outstanding Payments</h4>
              <p className="analytics-value warning">{formatCurrency(clientStats.overallStats.totalOwed)}</p>
            </div>
            <div className="analytics-card">
              <h4>Avg Orders per Client</h4>
              <p className="analytics-value">{clientStats.overallStats.averageOrdersPerClient}</p>
            </div>
          </div>

          {/* Top Client Analytics Cards */}
          <div className="top-clients-analytics">
            <h3>Top Client Analytics</h3>
            <div className="top-clients-cards">
              {/* MVP Client - Highest Paying */}
              {clientStats.overallStats.topPayingClients?.length > 0 && (
                <div className="client-highlight-card mvp-client">
                  <div className="card-icon">👑</div>
                  <h4>MVP Client</h4>
                  <div className="client-details">
                    <p className="client-name">{clientStats.overallStats.topPayingClients[0].name}</p>
                    <p className="client-metric">
                      <span className="label">Total Revenue:</span>
                      <span className="value">{formatCurrency(clientStats.overallStats.topPayingClients[0].totalValue)}</span>
                    </p>
                    <p className="client-metric">
                      <span className="label">Total Paid:</span>
                      <span className="value success">{formatCurrency(clientStats.overallStats.topPayingClients[0].totalPaid)}</span>
                    </p>
                  </div>
                  <div className="badge mvp-badge">Highest Revenue</div>
                </div>
              )}

              {/* Loyal Client - Best Loyalty Score */}
              {clientStats.overallStats.mostLoyalClient && (
                <div className="client-highlight-card loyal-client">
                  <div className="card-icon">⭐</div>
                  <h4>Loyal Client</h4>
                  <div className="client-details">
                    <p className="client-name">{clientStats.overallStats.mostLoyalClient.name}</p>
                    <p className="client-metric">
                      <span className="label">Loyalty Tier:</span>
                      <span className="value tier">{clientStats.overallStats.mostLoyalClient.loyaltyTier}</span>
                    </p>
                    <p className="client-metric">
                      <span className="label">Total Orders:</span>
                      <span className="value">{clientStats.overallStats.mostLoyalClient.totalOrders}</span>
                    </p>
                    <p className="client-metric">
                      <span className="label">Payment Rate:</span>
                      <span className="value success">{clientStats.overallStats.mostLoyalClient.paymentRate}%</span>
                    </p>
                  </div>
                  <div className="badge loyal-badge">Score: {clientStats.overallStats.mostLoyalClient.loyaltyScore}</div>
                </div>
              )}

              {/* Most Purchasing Client - Highest Order Count */}
              {clientStats.clients?.length > 0 && (() => {
                const mostPurchasingClient = clientStats.clients.reduce((prev, current) => 
                  (current.statistics.totalOrders > prev.statistics.totalOrders) ? current : prev
                , clientStats.clients[0]);
                
                return (
                  <div className="client-highlight-card purchasing-client">
                    <div className="card-icon">🛒</div>
                    <h4>Most Purchasing</h4>
                    <div className="client-details">
                      <p className="client-name">{mostPurchasingClient.name}</p>
                      <p className="client-metric">
                        <span className="label">Total Orders:</span>
                        <span className="value highlight">{mostPurchasingClient.statistics.totalOrders}</span>
                      </p>
                      <p className="client-metric">
                        <span className="label">Total Revenue:</span>
                        <span className="value">{formatCurrency(mostPurchasingClient.statistics.totalValue)}</span>
                      </p>
                      <p className="client-metric">
                        <span className="label">Orders/Month:</span>
                        <span className="value">{mostPurchasingClient.statistics.ordersPerMonth}</span>
                      </p>
                    </div>
                    <div className="badge purchase-badge">Most Active</div>
                  </div>
                );
              })()}
            </div>
          </div>

          {clientStats.overallStats.topPayingClients?.length > 0 && (
            <div className="top-clients-preview">
              <h3>Top 3 Paying Clients</h3>
              <div className="top-clients-mini-list">
                {clientStats.overallStats.topPayingClients.slice(0, 3).map((client, index) => (
                  <div key={index} className="mini-client-card">
                    <span className="client-rank">{index + 1}</span>
                    <div className="client-mini-info">
                      <strong>{client.name}</strong>
                      <small>{formatCurrency(client.totalValue)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role-based quick actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {user?.role === 'receptionist' && (
            <>
              <Link to="/clients/new" className="action-btn">
                Add New Client
              </Link>
              <Link to="/clients/analytics" className="action-btn analytics-btn">
                📊 Client Analytics
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/clients/new" className="action-btn">
                Add New Client
              </Link>
              <Link to="/orders/new" className="action-btn">
                Create New Order
              </Link>
              <Link to="/users/new" className="action-btn">
                Add New User
              </Link>
              <Link to="/clients/analytics" className="action-btn analytics-btn">
                📊 Client Analytics
              </Link>
            </>
          )}
          {['designer', 'worker'].includes(user?.role) && (
            <Link to="/orders" className="action-btn">
              View All Orders
            </Link>
          )}
          {user?.role === 'financial' && (
            <>
              <Link to="/orders" className="action-btn">
                View Orders
              </Link>
              <Link to="/financial-stats" className="action-btn">
                Financial Reports
              </Link>
              <Link to="/clients/analytics" className="action-btn analytics-btn">
                📊 Client Analytics
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
