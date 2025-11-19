import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clientService from '../../services/clientService';
import { orderService } from '../../services/orderService';
import './Clients.css';

const ClientDetail = () => {
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    loadClientData();
  }, [id]);

  const loadClientData = async () => {
    try {
      const [clientData, ordersData] = await Promise.all([
        clientService.getClientById(id),
        orderService.getOrders({ clientId: id }),
      ]);
      setClient(clientData);
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load client details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!client) return <div className="error">Client not found</div>;

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h1>Client Details</h1>
        <Link to={`/clients/edit/${id}`} className="btn-primary">
          Edit Client
        </Link>
      </div>

      <div className="detail-card">
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{client.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{client.phone}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Factory Name:</span>
          <span className="detail-value">{client.factoryName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span className="detail-value">{client.address || 'N/A'}</span>
        </div>
        {client.notes && (
          <div className="detail-row">
            <span className="detail-label">Notes:</span>
            <span className="detail-value">{client.notes}</span>
          </div>
        )}
      </div>

      <div className="client-orders">
        <h2>Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p>No orders found for this client.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Repeats</th>
                  <th>Price</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.type}</td>
                    <td>{order.size}</td>
                    <td>{order.repeats}</td>
                    <td>${order.price}</td>
                    <td>${order.balance}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="actions">
                      <Link to={`/orders/${order._id}`} className="btn-view">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="detail-actions">
        <Link to="/clients" className="btn-secondary">
          Back to Clients
        </Link>
      </div>
    </div>
  );
};

export default ClientDetail;
