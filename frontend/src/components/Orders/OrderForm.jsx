import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services/clientService';
import { orderService } from '../../services/orderService';
import './Orders.css';

const OrderForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    client: '',
    repeats: '',
    size: '',
    type: '',
    price: '',
    deposit: '',
    description: '',
    designLink: '',
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
        size: order.sheetSize || order.size,
        type: order.type,
        price: order.totalPrice || order.price,
        deposit: order.deposit,
        description: order.notes || order.description || '',
        designLink: order.designLink || '',
        deliveryDate: order.deliveryDate
          ? new Date(order.deliveryDate).toISOString().split('T')[0]
          : '',
        status: order.orderState || order.status,
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
      let submitData;
      
      // Worker can only update orderState
      if (user.role === 'worker') {
        submitData = {
          orderState: formData.status,
        };
      } 
      // Designer can update orderState, designLink, and deposit
      else if (user.role === 'designer') {
        submitData = {
          orderState: formData.status,
          notes: formData.description,
          designLink: formData.designLink,
          deposit: Number(formData.deposit),
        };
      }
      // Financial can update payments
      else if (user.role === 'financial') {
        submitData = {
          deposit: Number(formData.deposit),
          totalPrice: Number(formData.price),
          notes: formData.description,
        };
      }
      // Admin can update everything
      else {
        submitData = {
          ...formData,
          repeats: Number(formData.repeats),
          totalPrice: Number(formData.price),
          deposit: Number(formData.deposit),
          orderState: formData.status,
          notes: formData.description,
        };
      }

      if (isEdit) {
        await orderService.updateOrder(id, submitData);
      } else {
        await orderService.createOrder(submitData);
      }
      navigate('/orders');
    } catch (err) {
      // Enhanced error message with material stock details if available
      let errorMessage = err.response?.data?.message || 'Operation failed';
      
      if (err.response?.data?.materialInfo) {
        const info = err.response.data.materialInfo;
        errorMessage += `\n\nMaterial Stock Details:\n`;
        errorMessage += `• Material: ${info.name}\n`;
        errorMessage += `• Required: ${info.required.toFixed(2)} ${info.unit}\n`;
        errorMessage += `• Available: ${info.available.toFixed(2)} ${info.unit}\n`;
        errorMessage += `• Shortage: ${info.shortage.toFixed(2)} ${info.unit}\n`;
        errorMessage += `• Stock Status: ${info.status}`;
      }
      
      setError(errorMessage);
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
        
        {/* Only show full form to admin, for worker/designer show limited fields */}
        {(user.role === 'admin' || !isEdit) && (
          <>
            <div className="form-group">
              <label htmlFor="client">Client *</label>
              <select
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
                disabled={isEdit && user.role !== 'admin'}
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
                  disabled={isEdit && user.role !== 'admin'}
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
                  disabled={isEdit && user.role !== 'admin'}
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
                  disabled={isEdit && user.role !== 'admin'}
                />
              </div>
            </div>
          </>
        )}

        {/* Financial and Admin can see/edit prices */}
        {(user.role === 'admin' || user.role === 'financial' || !isEdit) && (
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
                disabled={isEdit && user.role === 'worker'}
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
                disabled={isEdit && user.role === 'worker'}
              />
            </div>

            <div className="form-group">
              <label>Balance</label>
              <input
                type="text"
                value={`${(formData.price - formData.deposit || 0).toFixed(2)} EGP`}
                disabled
              />
            </div>
          </div>
        )}

        {/* All roles can see status, but only certain roles can edit it */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={user.role === 'financial' && isEdit}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {(user.role === 'admin' || !isEdit) && (
            <div className="form-group">
              <label htmlFor="deliveryDate">Delivery Date</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                disabled={isEdit && user.role !== 'admin'}
              />
            </div>
          )}
        </div>

        {/* Notes field for all roles except when worker is creating new */}
        {(isEdit || user.role !== 'worker') && (
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              disabled={isEdit && user.role === 'financial'}
            />
          </div>
        )}

        {/* Design Link field for designers */}
        {user.role === 'designer' && isEdit && (
          <div className="form-group">
            <label htmlFor="designLink">Design Link</label>
            <input
              type="url"
              id="designLink"
              name="designLink"
              value={formData.designLink}
              onChange={handleChange}
              placeholder="https://example.com/design-file.pdf"
            />
            <small className="form-help">
              Provide a link to the design file (PDF, image, etc.)
            </small>
          </div>
        )}

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
