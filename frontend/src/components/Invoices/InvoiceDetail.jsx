import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDragScroll } from '../../hooks/useDragScroll';
import invoiceService from '../../services/invoiceService';
import './Invoices.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useDragScroll();

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(id);
      setInvoice(response.data);
    } catch (err) {
      setError('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Loading invoice...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!invoice) return <div className="error">Invoice not found</div>;

  return (
    <div className="invoice-detail">
      <div className="detail-header no-print">
        <button onClick={() => navigate('/invoices')} className="btn-secondary">
          ← Back to Invoices
        </button>
        <div className="header-actions">
          <button onClick={handlePrint} className="btn-secondary">
            Print
          </button>
          {['admin', 'designer'].includes(user?.role) && (
            <Link to={`/invoices/edit/${invoice._id}`} className="btn-primary">
              Edit Invoice
            </Link>
          )}
        </div>
      </div>

      <div className="invoice-document">
        {/* Invoice Header */}
        <div className="invoice-header">
          <div className="invoice-title">
            <h1>INVOICE</h1>
            <p className="invoice-number">#{invoice._id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div className="invoice-meta">
            <div className="meta-item">
              <label>Date:</label>
              <span>{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="meta-item">
              <label>Status:</label>
              <span className={`status-badge status-${invoice.status}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="invoice-parties">
          <div className="party-section">
            <h3>Bill To:</h3>
            <p className="party-name">{invoice.client?.name || invoice.clientSnapshot?.name}</p>
            <p>{invoice.client?.phone || invoice.clientSnapshot?.phone}</p>
            {(invoice.client?.factoryName || invoice.clientSnapshot?.factoryName) && (
              <p>{invoice.client?.factoryName || invoice.clientSnapshot?.factoryName}</p>
            )}
            {invoice.client?.address && <p>{invoice.client.address}</p>}
          </div>

          <div className="party-section">
            <h3>Created By:</h3>
            <p className="party-name">{invoice.createdBy?.name}</p>
            <p>{invoice.createdBy?.email}</p>
          </div>
        </div>

        {/* Invoice Notes */}
        {invoice.notes && (
          <div className="invoice-notes">
            <h3>Notes:</h3>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Orders Table */}
        <div className="invoice-items">
          <h2>Orders ({invoice.orders?.length || 0})</h2>
          {invoice.orders && invoice.orders.length > 0 ? (
            <>
              <div className="table-wrapper">
                <div className="scroll-indicator">
                  ← Scroll to see all columns →
                </div>
                <div className="table-container" ref={tableRef}>
                  <table className="items-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Material</th>
                    <th>Height (m)</th>
                    <th>Repeats</th>
                    <th>Order Size</th>
                    <th>Total Price</th>
                    <th>Deposit</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.orders.map((order, index) => {
                    const remaining = order.remainingAmount !== undefined 
                      ? order.remainingAmount 
                      : (order.totalPrice - order.deposit);
                    return (
                      <tr key={order._id || index}>
                        <td>{order.clientName || order.clientSnapshot?.name || 'N/A'}</td>
                        <td>{order.material?.name || order.type || 'N/A'}</td>
                        <td>{order.sheetHeight} m</td>
                        <td>{order.repeats}</td>
                        <td>{order.orderSize?.toFixed(2)} m</td>
                        <td>{order.totalPrice?.toFixed(2)} EGP</td>
                        <td>{order.deposit?.toFixed(2)} EGP</td>
                        <td>{remaining?.toFixed(2)} EGP</td>
                        <td>
                          <span className={`status-badge status-${order.orderState}`}>
                            {order.orderState}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

              {/* Order Details Section */}
              <div className="orders-details">
                {invoice.orders.map((order, index) => (
                  <div key={order._id || index} className="order-detail-card">
                    <h4>Order #{index + 1} - {order.clientName || order.clientSnapshot?.name || 'N/A'}</h4>
                    <div className="order-detail-grid">
                      {order.designLink && (
                        <div className="detail-item">
                          <label>Design Link:</label>
                          <a href={order.designLink} target="_blank" rel="noopener noreferrer">
                            View Design
                          </a>
                        </div>
                      )}
                      {order.notes && (
                        <div className="detail-item full-width">
                          <label>Notes:</label>
                          <p>{order.notes}</p>
                        </div>
                      )}
                      <div className="detail-item">
                        <label>Order Date:</label>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No orders added to this invoice yet.</p>
            </div>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="invoice-summary">
          <div className="summary-table">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{invoice.subtotal?.toFixed(2)} EGP</span>
            </div>
            
            {invoice.tax > 0 && (
              <div className="summary-row">
                <span>Tax:</span>
                <span>{invoice.tax?.toFixed(2)} EGP</span>
              </div>
            )}
            
            {invoice.shipping > 0 && (
              <div className="summary-row">
                <span>Shipping:</span>
                <span>{invoice.shipping?.toFixed(2)} EGP</span>
              </div>
            )}
            
            {invoice.discount > 0 && (
              <div className="summary-row">
                <span>Discount:</span>
                <span>-{invoice.discount?.toFixed(2)} EGP</span>
              </div>
            )}
            
            <div className="summary-row total-row">
              <strong>Total:</strong>
              <strong>{invoice.total?.toFixed(2)} EGP</strong>
            </div>
            
            <div className="summary-row remaining-row">
              <strong>Total Remaining:</strong>
              <strong>{invoice.totalRemaining?.toFixed(2)} EGP</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for your business!</p>
          {invoice.updatedBy && (
            <p className="updated-info">
              Last updated by {invoice.updatedBy.name} on {formatDate(invoice.updatedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;

