import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clientService from '../../services/clientService';
import { exportClientAnalyticsToPDF } from '../../utils/pdfExport';
import Loading from '../Loading';
import './ClientAnalytics.css';

const ClientAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('totalValue'); // totalValue, totalPaid, totalOrders
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClientsStatistics();
  }, []);

  const loadClientsStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientService.getClientsStatistics();
      setData(response.data);
    } catch (err) {
      console.error('Error loading client statistics:', err);
      setError(err.response?.data?.message || 'Failed to load client statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortedClients = () => {
    if (!data?.clients) return [];
    
    let filtered = data.clients;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.factoryName && client.factoryName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      aVal = a.statistics[sortBy] || 0;
      bVal = b.statistics[sortBy] || 0;
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    try {
      exportClientAnalyticsToPDF(data);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="client-analytics">
        <Loading size="large" message="Loading client analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-analytics">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadClientsStatistics} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const sortedClients = getSortedClients();

  return (
    <div className="client-analytics">
      <div className="analytics-header">
        <h1>Client Analytics Report</h1>
        <div className="header-actions">
          <button onClick={handleExportPDF} className="btn-export-pdf">
            <i className="fas fa-file-pdf"></i> Export PDF
          </button>
          <button onClick={loadClientsStatistics} className="btn-refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className="overview-stats">
        <div className="stat-card-large total-clients">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>Total Clients</h3>
            <p className="stat-number">{data.overallStats.totalClients}</p>
          </div>
        </div>

        <div className="stat-card-large total-revenue">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">{formatCurrency(data.overallStats.totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card-large total-paid">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>Total Paid</h3>
            <p className="stat-number">{formatCurrency(data.overallStats.totalPaid)}</p>
            <p className="stat-subtitle">
              {((data.overallStats.totalPaid / data.overallStats.totalRevenue) * 100).toFixed(1)}% collected
            </p>
          </div>
        </div>

        <div className="stat-card-large total-owed">
          <div className="stat-icon">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-content">
            <h3>Total Outstanding</h3>
            <p className="stat-number">{formatCurrency(data.overallStats.totalOwed)}</p>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="secondary-stats">
        <div className="stat-item">
          <span className="stat-label">Total Orders:</span>
          <span className="stat-value">{data.overallStats.totalOrders}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Invoices:</span>
          <span className="stat-value">{data.overallStats.totalInvoices}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Orders per Client:</span>
          <span className="stat-value">{data.overallStats.averageOrdersPerClient}</span>
        </div>
      </div>

      {/* Top Paying Clients */}
      <div className="top-clients-section">
        <h2><i className="fas fa-trophy"></i> Top 5 Paying Clients</h2>
        <div className="top-clients-list">
          {data.overallStats.topPayingClients.map((client, index) => (
            <div key={index} className="top-client-card">
              <div className="rank">{index + 1}</div>
              <div className="client-info">
                <h4>{client.name}</h4>
                <p className="total-value">Total Value: {formatCurrency(client.totalValue)}</p>
                <p className="total-paid">Paid: {formatCurrency(client.totalPaid)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Loyal Client */}
      {data.overallStats.mostLoyalClient && (
        <div className="most-loyal-section">
          <h2><i className="fas fa-medal"></i> Most Loyal Client</h2>
          <div className="loyal-client-card">
            <div className="loyal-badge">
              <div className="trophy-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="loyalty-tier-badge" data-tier={data.overallStats.mostLoyalClient.loyaltyTier.toLowerCase()}>
                {data.overallStats.mostLoyalClient.loyaltyTier}
              </div>
            </div>
            <div className="loyal-client-details">
              <h3>{data.overallStats.mostLoyalClient.name}</h3>
              {data.overallStats.mostLoyalClient.factoryName && (
                <p className="factory-name">{data.overallStats.mostLoyalClient.factoryName}</p>
              )}
              <p className="phone">{data.overallStats.mostLoyalClient.phone}</p>
              
              <div className="loyalty-metrics">
                <div className="loyalty-score-display">
                  <div className="score-circle">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="score-bg" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        className="score-fill"
                        strokeDasharray={`${data.overallStats.mostLoyalClient.loyaltyScore * 2.827} 282.7`}
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-number">{data.overallStats.mostLoyalClient.loyaltyScore}</span>
                      <span className="score-label">Loyalty</span>
                    </div>
                  </div>
                </div>
                
                <div className="loyalty-stats">
                  <div className="loyal-stat">
                    <span className="label">Total Orders:</span>
                    <span className="value">{data.overallStats.mostLoyalClient.totalOrders}</span>
                  </div>
                  <div className="loyal-stat">
                    <span className="label">Total Value:</span>
                    <span className="value">{formatCurrency(data.overallStats.mostLoyalClient.totalValue)}</span>
                  </div>
                  <div className="loyal-stat">
                    <span className="label">Payment Rate:</span>
                    <span className="value">{data.overallStats.mostLoyalClient.paymentRate}%</span>
                  </div>
                  <div className="loyal-stat">
                    <span className="label">Client Since:</span>
                    <span className="value">{data.overallStats.mostLoyalClient.clientAgeDays} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Client Table */}
      <div className="clients-table-section">
        <div className="table-header">
          <h2>Detailed Client Statistics</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="clients-analytics-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Client Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Contact</th>
                <th onClick={() => handleSort('totalOrders')} className="sortable">
                  Orders {sortBy === 'totalOrders' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalValue')} className="sortable">
                  Total Value {sortBy === 'totalValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalPaid')} className="sortable">
                  Total Paid {sortBy === 'totalPaid' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalOwed')} className="sortable">
                  Outstanding {sortBy === 'totalOwed' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('loyaltyScore')} className="sortable">
                  Loyalty {sortBy === 'loyaltyScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Payment Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => (
                <tr key={client._id}>
                  <td>
                    <div className="client-name-cell">
                      <strong>{client.name}</strong>
                      {client.factoryName && (
                        <small className="factory-name">{client.factoryName}</small>
                      )}
                    </div>
                  </td>
                  <td>{client.phone}</td>
                  <td>
                    <div className="orders-breakdown">
                      <span className="total-orders">{client.statistics.totalOrders}</span>
                      <small>
                        ({client.statistics.activeOrders} active, {client.statistics.pendingOrders} pending)
                      </small>
                    </div>
                  </td>
                  <td className="currency">{formatCurrency(client.statistics.totalValue)}</td>
                  <td className="currency success">{formatCurrency(client.statistics.totalPaid)}</td>
                  <td className="currency warning">{formatCurrency(client.statistics.totalOwed)}</td>
                  <td>
                    <div className="loyalty-cell">
                      <div className="loyalty-score-badge" data-tier={client.statistics.loyaltyTier.toLowerCase()}>
                        <span className="score">{client.statistics.loyaltyScore}</span>
                        <span className="tier">{client.statistics.loyaltyTier}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="payment-rate">
                      <span className={`rate-badge ${parseFloat(client.statistics.paymentRate) > 80 ? 'high' : parseFloat(client.statistics.paymentRate) > 50 ? 'medium' : 'low'}`}>
                        {client.statistics.paymentRate}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      client.statistics.activeOrders > 0 ? 'active' : 
                      client.statistics.pendingOrders > 0 ? 'pending' : 
                      'completed'
                    }`}>
                      {client.statistics.activeOrders > 0 ? 'Active' : 
                       client.statistics.pendingOrders > 0 ? 'Pending' : 
                       'Completed'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => navigate('/clients', { state: { searchTerm: client.name } })}
                        className="btn-view"
                        title="View client in Clients page"
                      >
                        <i className="fas fa-eye"></i>
                        <span>View</span>
                      </button>
                      <button 
                        onClick={() => navigate('/client-reports', { state: { preSelectedClientId: client._id } })}
                        className="btn-report"
                        title="Generate client report"
                      >
                        <i className="fas fa-file-chart"></i>
                        <span>Report</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedClients.length === 0 && (
            <div className="no-results">
              <p>No clients found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;
