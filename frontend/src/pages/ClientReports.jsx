import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import clientService from '../services/clientService';
import { formatDateTime } from '../utils/dateUtils';
import { exportClientReportToPDF } from '../utils/pdfExport';
import './ClientReports.css';

const ClientReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
    
    // Check if a client was pre-selected from navigation state
    if (location.state?.preSelectedClientId) {
      setSelectedClientId(location.state.preSelectedClientId);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientReport(selectedClientId);
    } else {
      setReportData(null);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients({ limit: 1000 });
      setClients(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientReport = async (clientId) => {
    try {
      setLoadingReport(true);
      setError('');
      const response = await clientService.getClientReport(clientId);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Client report endpoint not found. Please restart the backend server to load the new routes.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch client report');
      }
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: '#fff3cd', color: '#856404' },
      active: { bg: '#cce5ff', color: '#004085' },
      done: { bg: '#d4edda', color: '#155724' },
      delivered: { bg: '#d1ecf1', color: '#0c5460' },
      draft: { bg: '#e2e3e5', color: '#383d41' },
      sent: { bg: '#cce5ff', color: '#004085' },
      paid: { bg: '#d4edda', color: '#155724' },
      cancelled: { bg: '#f8d7da', color: '#721c24' },
    };

    const style = statusStyles[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: style.bg,
          color: style.color,
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '500',
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  };

  const handleExportPDF = () => {
    if (reportData) {
      exportClientReportToPDF(reportData);
    }
  };

  if (loading) {
    return (
      <div className="client-reports-container">
        <Loading message="Loading clients..." size="medium" />
      </div>
    );
  }

  return (
    <div className="client-reports-container">
      <div className="client-reports-content">
        <div className="client-reports-header">
          <div>
            <h1>Client Financial Reports</h1>
            <p>View detailed financial information for each client including orders, invoices, and payments</p>
          </div>
          {reportData && (
            <button className="export-pdf-btn" onClick={handleExportPDF}>
              <FontAwesomeIcon icon={faFilePdf} /> Export to PDF
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="client-selector-section">
          <label htmlFor="client-select">Select Client:</label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="client-select"
          >
            <option value="">-- Select a client --</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name} {client.factoryName ? `(${client.factoryName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {loadingReport && (
          <div className="loading-report">
            <Loading message="Loading report..." size="medium" />
          </div>
        )}

        {reportData && !loadingReport && (
          <div className="report-content">
            {/* Client Info */}
            <div className="client-info-card">
              <h2>{reportData.client.name}</h2>
              {reportData.client.factoryName && <p>Factory: {reportData.client.factoryName}</p>}
              {reportData.client.phone && <p>Phone: {reportData.client.phone}</p>}
              {reportData.client.address && <p>Address: {reportData.client.address}</p>}
            </div>

            {/* Summary Statistics */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total Orders</div>
                <div className="summary-value">{reportData.summary.totalOrders}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Invoices</div>
                <div className="summary-value">{reportData.summary.totalInvoices}</div>
              </div>
              <div className="summary-card highlight">
                <div className="summary-label">Total Paid</div>
                <div className="summary-value">{formatCurrency(reportData.summary.totalPaid)} EGP</div>
              </div>
              <div className="summary-card highlight">
                <div className="summary-label">Total Owed</div>
                <div className="summary-value">{formatCurrency(reportData.summary.totalOwed)} EGP</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Order Amount</div>
                <div className="summary-value">{formatCurrency(reportData.summary.totalOrderAmount)} EGP</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Invoice Amount</div>
                <div className="summary-value">{formatCurrency(reportData.summary.totalInvoiceAmount)} EGP</div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="section">
              <h2>Orders ({reportData.orders.length})</h2>
              {reportData.orders.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Size (m)</th>
                        <th>Total Price</th>
                        <th>Deposit</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.map((order) => (
                        <tr key={order._id}>
                          <td>{formatDateTime(order.createdAt)}</td>
                          <td>{order.type || order.material?.name || 'N/A'}</td>
                          <td>{order.orderSize ? formatCurrency(order.orderSize) : 'N/A'}</td>
                          <td>{formatCurrency(order.totalPrice)} EGP</td>
                          <td>{formatCurrency(order.deposit)} EGP</td>
                          <td>{formatCurrency(order.remainingAmount)} EGP</td>
                          <td>{getStatusBadge(order.orderState)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td colSpan="3"><strong>Totals:</strong></td>
                        <td><strong>{formatCurrency(reportData.summary.totalOrderAmount)} EGP</strong></td>
                        <td><strong>{formatCurrency(reportData.summary.totalDeposits)} EGP</strong></td>
                        <td><strong>{formatCurrency(reportData.summary.totalRemaining)} EGP</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="no-data">No orders found for this client.</p>
              )}

              {/* Orders by Status */}
              <div className="status-breakdown">
                <h3>Orders by Status</h3>
                <div className="status-grid">
                  {Object.entries(reportData.ordersByStatus).map(([status, count]) => (
                    count > 0 && (
                      <div key={status} className="status-item">
                        <span className="status-label">{status}:</span>
                        <span className="status-count">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Invoices Section */}
            <div className="section">
              <h2>Invoices ({reportData.invoices.length})</h2>
              {reportData.invoices.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subtotal</th>
                        <th>Tax</th>
                        <th>Shipping</th>
                        <th>Discount</th>
                        <th>Total</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td>{formatDateTime(invoice.invoiceDate || invoice.createdAt)}</td>
                          <td>{formatCurrency(invoice.subtotal)} EGP</td>
                          <td>{formatCurrency(invoice.tax)} EGP</td>
                          <td>{formatCurrency(invoice.shipping)} EGP</td>
                          <td>{formatCurrency(invoice.discount)} EGP</td>
                          <td>{formatCurrency(invoice.total)} EGP</td>
                          <td>{formatCurrency(invoice.totalRemaining)} EGP</td>
                          <td>{getStatusBadge(invoice.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td><strong>Totals:</strong></td>
                        <td><strong>{formatCurrency(reportData.summary.totalInvoiceAmount)} EGP</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td><strong>{formatCurrency(reportData.summary.totalInvoiceAmount)} EGP</strong></td>
                        <td><strong>{formatCurrency(reportData.summary.totalInvoiceRemaining)} EGP</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="no-data">No invoices found for this client.</p>
              )}

              {/* Invoices by Status */}
              <div className="status-breakdown">
                <h3>Invoices by Status</h3>
                <div className="status-grid">
                  {Object.entries(reportData.invoicesByStatus).map(([status, count]) => (
                    count > 0 && (
                      <div key={status} className="status-item">
                        <span className="status-label">{status}:</span>
                        <span className="status-count">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedClientId && !loadingReport && (
          <div className="empty-state">
            <p>Please select a client to view their financial report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientReports;

