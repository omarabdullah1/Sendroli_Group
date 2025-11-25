import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import './Invoices.css';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await invoiceService.getInvoices(params);
      const data = response.data || [];
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice? All orders within will be removed.')) {
      return;
    }

    try {
      await invoiceService.deleteInvoice(id);
      setInvoices(invoices.filter((invoice) => invoice._id !== id));
    } catch (err) {
      setError('Failed to delete invoice');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="invoice-list">
      <div className="list-header">
        <h1>Invoices</h1>
        {['admin', 'worker', 'designer'].includes(user?.role) && (
          <Link to="/invoices/new" className="btn-primary">
            Add Invoice
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>No invoices found. Create your first invoice!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Orders</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>#{invoice._id.slice(-6).toUpperCase()}</td>
                  <td>{invoice.client?.name || invoice.clientSnapshot?.name || 'N/A'}</td>
                  <td>{formatDate(invoice.invoiceDate)}</td>
                  <td>{invoice.orderCount || 0}</td>
                  <td>{invoice.subtotal?.toFixed(2) || '0.00'} EGP</td>
                  <td>{invoice.total?.toFixed(2) || '0.00'} EGP</td>
                  <td>{invoice.totalRemaining?.toFixed(2) || '0.00'} EGP</td>
                  <td>
                    <span className={`status-badge status-${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/invoices/${invoice._id}`} className="btn-view">
                      View
                    </Link>
                    
                    {['worker', 'admin', 'designer'].includes(user?.role) && (
                      <Link to={`/invoices/edit/${invoice._id}`} className="btn-edit">
                        Edit
                      </Link>
                    )}
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(invoice._id)}
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

export default InvoiceList;

