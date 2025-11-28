import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import Loading from '../components/Loading';

const FinancialStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await orderService.getFinancialStats();
      setStats(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Loading message="Loading statistics..." size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  const { overall, byState } = stats;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Financial Statistics</h1>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Orders</div>
            <div style={styles.statValue}>{overall?.totalOrders || 0}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Revenue</div>
            <div style={styles.statValue}>{overall?.totalRevenue || 0} EGP</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Deposits</div>
            <div style={styles.statValue}>{overall?.totalDeposits || 0} EGP</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Remaining</div>
            <div style={styles.statValue}>{overall?.totalRemaining || 0} EGP</div>
          </div>
        </div>

        <h2 style={styles.subtitle}>Orders by Status</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Count</th>
                <th style={styles.th}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {byState && byState.length > 0 ? (
                byState.map((stat, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      <span style={getStatusStyle(stat._id)}>{stat._id}</span>
                    </td>
                    <td style={styles.td}>{stat.count}</td>
                    <td style={styles.td}>{stat.totalValue} EGP</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={styles.noData}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary, #111827)',
    marginBottom: '2rem',
  },
  subtitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary, #111827)',
    marginTop: '2rem',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: 'var(--text-secondary, #6b7280)',
  },
  error: {
    backgroundColor: 'var(--error, #ef4444)',
    color: '#fff',
    padding: '1rem',
    borderRadius: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'var(--surface, #fff)',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--border-light, #e5e7eb)',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary, #6b7280)',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2rem',
    color: 'var(--text-primary, #111827)',
    fontWeight: 'bold',
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
    color: 'var(--text-secondary, #6b7280)',
  },
};

export default FinancialStats;
