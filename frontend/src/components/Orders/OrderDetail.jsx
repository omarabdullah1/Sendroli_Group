import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import './Orders.css';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError('Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">Order not found</div>;

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h1>Order Details</h1>
        <Link to={`/orders/edit/${id}`} className="btn-primary">
          Edit Order
        </Link>
      </div>

      <div className="detail-card">
        <h3>Client Information</h3>
        <div className="detail-row">
          <span className="detail-label">Client Name:</span>
          <span className="detail-value">{order.client?.name || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{order.client?.phone || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Factory Name:</span>
          <span className="detail-value">{order.client?.factoryName || 'N/A'}</span>
        </div>
      </div>

      <div className="detail-card">
      <h3>Order Information</h3>
        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{order.type}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Height (m):</span>
          <span className="detail-value">{order.sheetHeight || order.size || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Order Size:</span>
          <span className="detail-value">{(order.orderSize ? order.orderSize : (Number(order.repeats) * Number(order.sheetHeight || 0))).toFixed(2)} m</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Repeats:</span>
          <span className="detail-value">{order.repeats}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
          </span>
        </div>
        {order.deliveryDate && (
          <div className="detail-row">
            <span className="detail-label">Delivery Date:</span>
            <span className="detail-value">
              {new Date(order.deliveryDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {order.description && (
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">{order.description}</span>
          </div>
        )}
      </div>

        <div className="detail-card">
        <h3>Financial Information</h3>
        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span className="detail-value">{(order.totalPrice || order.price).toFixed(2)} EGP</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Deposit:</span>
          <span className="detail-value">{order.deposit.toFixed(2)} EGP</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Remaining:</span>
          <span className="detail-value">
            <strong>{(order.remainingAmount || order.balance || 0).toFixed(2)} EGP</strong>
          </span>
        </div>
      </div>

      <div className="detail-card">
        <h3>Additional Information</h3>
        <div className="detail-row">
          <span className="detail-label">Created By:</span>
          <span className="detail-value">
            {order.createdBy?.username || 'N/A'} ({order.createdBy?.role || 'N/A'})
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Created At:</span>
          <span className="detail-value">
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Last Updated:</span>
          <span className="detail-value">
            {new Date(order.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="detail-actions">
        <Link to="/orders" className="btn-secondary">
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail;
