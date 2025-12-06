import { faChartLine, faDollarSign, faFileInvoice, faFilePdf, faShoppingCart, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import clientService from '../services/clientService';
import invoiceService from '../services/invoiceService';
import orderService from '../services/orderService';
import { exportFinancialReportToPDF } from '../utils/pdfExport';
import './FinancialReport.css';

const FinancialReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all necessary data
      const [ordersRes, invoicesRes, clientsRes, statsRes] = await Promise.all([
        orderService.getOrders({ limit: 10000 }),
        invoiceService.getInvoices({ limit: 10000 }),
        clientService.getClients({ limit: 10000 }),
        orderService.getFinancialStats(),
      ]);

      const orders = ordersRes.data || [];
      const invoices = invoicesRes.data || [];
      const clients = clientsRes.data || [];
      const stats = statsRes.data || {};

      // Filter by date range if specified
      let filteredOrders = orders;
      let filteredInvoices = invoices;

      if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        });

        filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt);
          return invoiceDate >= start && invoiceDate <= end;
        });
      } else if (dateRange !== 'all') {
        const now = new Date();
        const start = new Date();

        switch (dateRange) {
          case 'today':
            start.setHours(0, 0, 0, 0);
            break;
          case 'week':
            start.setDate(now.getDate() - 7);
            break;
          case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            start.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }

        if (dateRange !== 'all') {
          filteredOrders = orders.filter(order => new Date(order.createdAt) >= start);
          filteredInvoices = invoices.filter(invoice => 
            new Date(invoice.invoiceDate || invoice.createdAt) >= start
          );
        }
      }

      // Calculate summary statistics
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalPaid = filteredOrders.reduce((sum, order) => sum + (order.deposit || 0), 0);
      const totalOutstanding = totalRevenue - totalPaid;

      const totalInvoiceAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalInvoicePaid = filteredInvoices.reduce((sum, inv) => 
        sum + ((inv.total || 0) - (inv.totalRemaining || 0)), 0
      );

      // Get unique clients from orders
      const clientIds = new Set(filteredOrders.map(o => o.client?._id || o.client).filter(Boolean));
      const activeClients = clientIds.size;

      // Calculate revenue by month
      const revenueByMonth = calculateRevenueByMonth(filteredOrders);

      // Calculate top clients
      const topClients = calculateTopClients(filteredOrders, clients);

      // Calculate orders by status
      const ordersByStatus = filteredOrders.reduce((acc, order) => {
        acc[order.orderState] = (acc[order.orderState] || 0) + 1;
        return acc;
      }, {});

      // Calculate invoices by status
      const invoicesByStatus = filteredInvoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate payment statistics
      const paymentStats = {
        averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
        averagePaymentRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
        fullyPaidOrders: filteredOrders.filter(o => o.remainingAmount === 0).length,
        partiallyPaidOrders: filteredOrders.filter(o => o.deposit > 0 && o.remainingAmount > 0).length,
        unpaidOrders: filteredOrders.filter(o => o.deposit === 0).length,
      };

      setReportData({
        summary: {
          totalRevenue,
          totalPaid,
          totalOutstanding,
          totalOrders: filteredOrders.length,
          totalInvoices: filteredInvoices.length,
          totalInvoiceAmount,
          totalInvoicePaid,
          activeClients,
        },
        revenueByMonth,
        topClients,
        ordersByStatus,
        invoicesByStatus,
        paymentStats,
        stats,
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueByMonth = (orders) => {
    const monthlyData = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          count: 0,
          totalRevenue: 0,
          totalPaid: 0,
          outstanding: 0,
        };
      }

      monthlyData[key].count++;
      monthlyData[key].totalRevenue += order.totalPrice || 0;
      monthlyData[key].totalPaid += order.deposit || 0;
      monthlyData[key].outstanding += order.remainingAmount || 0;
    });

    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    }).slice(0, 12); // Last 12 months
  };

  const calculateTopClients = (orders, clients) => {
    const clientStats = {};

    orders.forEach(order => {
      const clientId = order.client?._id || order.client;
      if (!clientId) return;

      if (!clientStats[clientId]) {
        const client = clients.find(c => c._id === clientId);
        clientStats[clientId] = {
          id: clientId,
          name: order.client?.name || client?.name || 'Unknown',
          orderCount: 0,
          totalRevenue: 0,
          totalPaid: 0,
          outstanding: 0,
        };
      }

      clientStats[clientId].orderCount++;
      clientStats[clientId].totalRevenue += order.totalPrice || 0;
      clientStats[clientId].totalPaid += order.deposit || 0;
      clientStats[clientId].outstanding += order.remainingAmount || 0;
    });

    return Object.values(clientStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10); // Top 10 clients
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleExportPDF = () => {
    if (reportData) {
      exportFinancialReportToPDF(reportData);
    }
  };

  if (loading) {
    return (
      <div className="financial-report-container">
        <Loading message="Generating financial report..." size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="financial-report-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="financial-report-container">
      <div className="financial-report-content">
        {/* Header */}
        <div className="report-header">
          <div className="header-left">
            <h1>
              <FontAwesomeIcon icon={faChartLine} /> Financial Report
            </h1>
            <p>Comprehensive overview of your business finances</p>
          </div>
          <button className="export-pdf-btn" onClick={handleExportPDF}>
            <FontAwesomeIcon icon={faFilePdf} /> Export to PDF
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="date-filter-section">
          <label>Date Range:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="custom-date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="summary-cards-grid">
          <div className="summary-card revenue">
            <div className="card-icon">
              <FontAwesomeIcon icon={faDollarSign} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Revenue</div>
              <div className="card-value">{formatCurrency(reportData.summary.totalRevenue)} EGP</div>
              <div className="card-subtext">
                {reportData.summary.totalOrders} orders
              </div>
            </div>
          </div>

          <div className="summary-card paid">
            <div className="card-icon">
              <FontAwesomeIcon icon={faDollarSign} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Paid</div>
              <div className="card-value">{formatCurrency(reportData.summary.totalPaid)} EGP</div>
              <div className="card-subtext">
                {reportData.paymentStats.averagePaymentRate.toFixed(1)}% collection rate
              </div>
            </div>
          </div>

          <div className="summary-card outstanding">
            <div className="card-icon">
              <FontAwesomeIcon icon={faDollarSign} />
            </div>
            <div className="card-content">
              <div className="card-label">Outstanding</div>
              <div className="card-value">{formatCurrency(reportData.summary.totalOutstanding)} EGP</div>
              <div className="card-subtext">
                {((reportData.summary.totalOutstanding / reportData.summary.totalRevenue) * 100 || 0).toFixed(1)}% remaining
              </div>
            </div>
          </div>

          <div className="summary-card clients">
            <div className="card-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="card-content">
              <div className="card-label">Active Clients</div>
              <div className="card-value">{reportData.summary.activeClients}</div>
              <div className="card-subtext">
                Avg: {formatCurrency(reportData.paymentStats.averageOrderValue)} EGP/order
              </div>
            </div>
          </div>

          <div className="summary-card orders">
            <div className="card-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Orders</div>
              <div className="card-value">{reportData.summary.totalOrders}</div>
              <div className="card-subtext">
                {Object.entries(reportData.ordersByStatus).map(([status, count]) => 
                  `${count} ${status}`
                ).join(', ')}
              </div>
            </div>
          </div>

          <div className="summary-card invoices">
            <div className="card-icon">
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Invoices</div>
              <div className="card-value">{reportData.summary.totalInvoices}</div>
              <div className="card-subtext">
                {formatCurrency(reportData.summary.totalInvoiceAmount)} EGP
              </div>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="section">
          <h2>Payment Statistics</h2>
          <div className="payment-stats-grid">
            <div className="stat-item">
              <div className="stat-label">Average Order Value</div>
              <div className="stat-value">{formatCurrency(reportData.paymentStats.averageOrderValue)} EGP</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Payment Collection Rate</div>
              <div className="stat-value">{reportData.paymentStats.averagePaymentRate.toFixed(2)}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Fully Paid Orders</div>
              <div className="stat-value">{reportData.paymentStats.fullyPaidOrders}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Partially Paid Orders</div>
              <div className="stat-value">{reportData.paymentStats.partiallyPaidOrders}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Unpaid Orders</div>
              <div className="stat-value">{reportData.paymentStats.unpaidOrders}</div>
            </div>
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="section">
          <h2>Revenue by Month</h2>
          {reportData.revenueByMonth.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Total Revenue</th>
                    <th>Total Paid</th>
                    <th>Outstanding</th>
                    <th>Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.revenueByMonth.map((item, index) => (
                    <tr key={index}>
                      <td>{`${item.month}/${item.year}`}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(item.totalRevenue)} EGP</td>
                      <td>{formatCurrency(item.totalPaid)} EGP</td>
                      <td>{formatCurrency(item.outstanding)} EGP</td>
                      <td>{((item.totalPaid / item.totalRevenue) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No monthly data available</p>
          )}
        </div>

        {/* Top Clients */}
        <div className="section">
          <h2>Top Clients by Revenue</h2>
          {reportData.topClients.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Client Name</th>
                    <th>Orders</th>
                    <th>Total Revenue</th>
                    <th>Total Paid</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topClients.map((client, index) => (
                    <tr key={client.id}>
                      <td>{index + 1}</td>
                      <td>{client.name}</td>
                      <td>{client.orderCount}</td>
                      <td>{formatCurrency(client.totalRevenue)} EGP</td>
                      <td>{formatCurrency(client.totalPaid)} EGP</td>
                      <td>{formatCurrency(client.outstanding)} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No client data available</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="section">
          <h2>Orders by Status</h2>
          <div className="status-breakdown">
            <div className="status-grid">
              {Object.entries(reportData.ordersByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span className="status-label">{status}:</span>
                  <span className="status-count">{count}</span>
                  <span className="status-percentage">
                    ({((count / reportData.summary.totalOrders) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices by Status */}
        {reportData.summary.totalInvoices > 0 && (
          <div className="section">
            <h2>Invoices by Status</h2>
            <div className="status-breakdown">
              <div className="status-grid">
                {Object.entries(reportData.invoicesByStatus).map(([status, count]) => (
                  <div key={status} className="status-item">
                    <span className="status-label">{status}:</span>
                    <span className="status-count">{count}</span>
                    <span className="status-percentage">
                      ({((count / reportData.summary.totalInvoices) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReport;
