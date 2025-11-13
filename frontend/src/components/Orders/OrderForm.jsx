import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { clientService } from '../../services/clientService';
import './Orders.css';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    client: '',
    repeats: '',
    size: '',
    type: '',
    price: '',
    deposit: '',
    description: '',
    deliveryDate: '',
    status: 'pending',
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    loadClients();
    if (isEdit) {
      loadOrder();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadOrder = async () => {
    try {
      const order = await orderService.getOrderById(id);
      setFormData({
        client: order.client._id,
        repeats: order.repeats,
        size: order.size,
        type: order.type,
        price: order.price,
        deposit: order.deposit,
        description: order.description || '',
        deliveryDate: order.deliveryDate
          ? new Date(order.deliveryDate).toISOString().split('T')[0]
          : '',
        status: order.status,
      });
    } catch (err) {
      setError('Failed to load order');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        repeats: Number(formData.repeats),
        price: Number(formData.price),
        deposit: Number(formData.deposit),
      };

      if (isEdit) {
        await orderService.updateOrder(id, submitData);
      } else {
        await orderService.createOrder(submitData);
      }
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>{isEdit ? 'Edit Order' : 'Create New Order'}</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="entity-form">
        <div className="form-group">
          <label htmlFor="client">Client *</label>
          <select
            id="client"
            name="client"
            value={formData.client}
            onChange={handleChange}
            required
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name} - {client.factoryName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="size">Size *</label>
            <input
              type="text"
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="repeats">Repeats *</label>
            <input
              type="number"
              id="repeats"
              name="repeats"
              value={formData.repeats}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="deposit">Deposit *</label>
            <input
              type="number"
              id="deposit"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Balance</label>
            <input
              type="text"
              value={`$${(formData.price - formData.deposit || 0).toFixed(2)}`}
              disabled
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deliveryDate">Delivery Date</label>
            <input
              type="date"
              id="deliveryDate"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
