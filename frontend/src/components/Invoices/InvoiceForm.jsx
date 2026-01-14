import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDragScroll } from '../../hooks/useDragScroll';
import clientService from '../../services/clientService';
import invoiceService from '../../services/invoiceService';
import { materialService } from '../../services/materialService';
import orderService from '../../services/orderService';
import productService from '../../services/productService';
import OrderModal from '../Orders/OrderModal';
import './Invoices.css';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const tableRef = useDragScroll();

  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceTotals, setInvoiceTotals] = useState(null); // null means not loaded yet

  // Invoice form state
  const [formData, setFormData] = useState({
    client: '',
    invoiceDate: new Date().toISOString().slice(0, 16),
    tax: 0,
    shipping: 0,
    discount: 0,
    status: 'draft',
    notes: '',
  });

  // Order form state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    clientName: '',
    material: '',
    sheetWidth: '',
    sheetHeight: '',
    repeats: 1,
    totalPrice: 0,
    deposit: 0,
    orderState: 'pending',
    notes: '',
    designLink: '',
  });


  useEffect(() => {
    loadClients();
    loadMaterials();
    if (isEditMode) {
      loadInvoice();
    }

    // Cleanup function to clear timeouts
    return () => {
      if (window.invoiceUpdateTimeout) {
        clearTimeout(window.invoiceUpdateTimeout);
      }
    };
  }, [id]);

  // Load products once on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientService.getClients();
      const data = Array.isArray(response) ? response : response.data || [];
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true);
      // Get all materials with a high limit to get all materials
      const response = await materialService.getAll({ limit: 10000 });

      // Handle different API response structures
      let data = [];
      if (!response) {
        data = [];
      } else if (Array.isArray(response)) {
        data = response;
      } else if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data.materials)) {
          data = response.data.data.materials;
        } else if (Array.isArray(response.data.materials)) {
          data = response.data.materials;
        }
      }

      setMaterials(data);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      console.log('Products API Response:', response);
      console.log('Products data:', response.data);
      // Backend returns { success: true, count: X, data: [...products] }
      const productsArray = Array.isArray(response.data) ? response.data : [];
      console.log('Setting products:', productsArray);
      setProducts(productsArray);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    }
  };

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(id);
      const payload = response?.data || response;
      if (payload) {
        const inv = payload.data || payload;
        setFormData((prev) => ({
          ...prev,
          client: inv.client?._id || inv.client || prev.client,
          invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 16) : prev.invoiceDate,
          tax: inv.tax || 0,
          shipping: inv.shipping || 0,
          discount: inv.discount || 0,
          status: inv.status || prev.status,
          notes: inv.notes || prev.notes,
        }));
        setOrders(inv.orders || []);
        setInvoiceClientName(inv.client?.name || '');
        setInvoiceTotals(inv.totals || null);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateSubtotal = () => {
    // Sum of all order totalPrice values or calculated from material sellingPrice
    return orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice) || 0;
      if (price > 0) return sum + price;
      // Try to calculate via material sellingPrice x orderSize
      const materialPrice = materials.find(m => m._id === (order.material?._id || order.material))?.sellingPrice || 0;
      const repeats = Number(order.repeats) || 1;
      const height = Number(order.sheetHeight) || 0;
      const orderSize = repeats * height;
      return sum + (materialPrice * orderSize || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(formData.tax || 0);
    const shipping = parseFloat(formData.shipping || 0);
    const discount = parseFloat(formData.discount || 0);
    return subtotal + tax + shipping - discount;
  };

  const calculateTotalRemaining = () => {
    const invoiceTotal = calculateTotal();
    const totalDeposits = orders.reduce((sum, order) => sum + (parseFloat(order.deposit || 0) || 0), 0);
    return invoiceTotal - totalDeposits;
  };

  const getDisplayTotals = () => {
    if (isEditMode && invoiceTotals !== null) {
      return invoiceTotals;
    }
    return {
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      totalRemaining: calculateTotalRemaining(),
    };
  };

  const openAddOrderForm = () => {
    setOrderForm({
      clientName: clients.find(c => c._id === formData.client)?.name || '',
      material: '',
      sheetWidth: '',
      sheetHeight: '',
      repeats: 1,
      totalPrice: 0,
      deposit: 0,
      orderState: 'pending',
      notes: '',
      designLink: '',
    });
    setEditingOrder(null);
    setShowOrderForm(true);
  };

  const openEditOrderForm = (order) => {
    setOrderForm({
      clientName: order.clientName || order.clientSnapshot?.name || '',
      material: order.material?._id || order.material || '',
      sheetWidth: order.sheetWidth || '',
      sheetHeight: order.sheetHeight || '',
      repeats: order.repeats || 1,
      totalPrice: order.totalPrice || 0,
      deposit: order.deposit || 0,
      orderState: order.orderState || 'pending',
      notes: order.notes || '',
      designLink: order.designLink || '',
      _id: order._id,
    });
    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const handleSaveOrder = (payload) => {
    if (!payload) return;
    if (editingOrder && editingOrder._id) {
      setOrders((prev) => prev.map((o) => (o._id === editingOrder._id ? { ...o, ...payload, totalPrice: payload.totalPrice || payload.price || o.totalPrice, orderSize: payload.orderSize || (payload.repeats && payload.sheetHeight ? (Number(payload.repeats) * Number(payload.sheetHeight)) : o.orderSize) } : o)));
    } else if (editingOrder && editingOrder._id === undefined) {
      // local unsaved order
      setOrders((prev) => prev.map((o) => (o._id === editingOrder._id ? { ...o, ...payload, totalPrice: payload.totalPrice || payload.price || o.totalPrice, orderSize: payload.orderSize || (payload.repeats && payload.sheetHeight ? (Number(payload.repeats) * Number(payload.sheetHeight)) : o.orderSize) } : o)));
    } else {
      const newOrder = {
        ...payload,
        _id: payload._id || `tmp_${Date.now()}`,
        totalPrice: payload.totalPrice || payload.price || 0,
        orderSize: payload.orderSize || (payload.repeats && payload.sheetHeight ? (Number(payload.repeats) * Number(payload.sheetHeight)) : 0),
      };
      setOrders((prev) => [...prev, newOrder]);
    }
    setShowOrderForm(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (order) => {
    setOrders((prev) => prev.filter((o) => o._id !== order._id));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client) {
      setError('Please select a client');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const invoiceData = {
        client: formData.client,
        invoiceDate: formData.invoiceDate,
        tax: parseFloat(formData.tax) || 0,
        shipping: parseFloat(formData.shipping) || 0,
        discount: parseFloat(formData.discount) || 0,
        status: formData.status,
        notes: formData.notes,
      };

      let invoiceId;

      if (isEditMode) {
        await invoiceService.updateInvoice(id, invoiceData);
        invoiceId = id;
      } else {
        const response = await invoiceService.createInvoice(invoiceData);
        invoiceId = response.data._id;

        // Create all orders with invoice reference
        for (const order of orders) {
          // Extract material ID if it's an object
          const materialId = order.material?._id || order.material || null;

          const orderData = {
            client: formData.client, // Include invoice client ID
            clientName: order.clientName,
            material: materialId,
            sheetWidth: order.sheetWidth,
            sheetHeight: order.sheetHeight,
            repeats: order.repeats,
            totalPrice: order.totalPrice, // This will be recalculated by backend based on material * size
            deposit: order.deposit || 0,
            orderState: order.orderState || 'pending',
            notes: order.notes || '',
            designLink: order.designLink || '',
            invoice: invoiceId,
          };

          console.log('Creating order with data:', {
            material: materialId,
            sheetWidth: orderData.sheetWidth,
            sheetHeight: orderData.sheetHeight,
            repeats: orderData.repeats,
            totalPrice: orderData.totalPrice
          });

          await orderService.createOrder(orderData);
        }
      }

      navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && orders.length === 0) {
    return <div className="loading">Loading invoice...</div>;
  }

  return (
    <div className="invoice-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</h1>
        <button onClick={() => navigate('/invoices')} className="btn-secondary">
          Cancel
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="invoice-form">
        {/* Invoice Header Section */}
        <div className="form-section">
          <h2>Invoice Details</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Client *</label>
              {/* Allow client selection when creating new invoice OR if admin editing */}
              {(user?.role === 'admin' || !isEditMode) ? (
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.factoryName ? `(${client.factoryName})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={clients.find(c => c._id === formData.client)?.name || 'N/A'}
                  readOnly
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              )}
            </div>

            <div className="form-group">
              <label>Invoice Date</label>
              <input
                type="datetime-local"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Add invoice notes..."
            />
          </div>
        </div>

        {/* Orders Section */}
        <div className="form-section orders-section">
          <div className="section-header">
            <h2>Orders ({orders.length})</h2>
            {/* Admin and designer can add orders */}
            {['admin', 'designer'].includes(user?.role) && (
              <button
                type="button"
                onClick={openAddOrderForm}
                className="btn-primary"
              >
                + Add Order
              </button>
            )}
          </div>

          {orders.length > 0 && (
            <div className="table-wrapper">
              <div className="scroll-indicator">
                ← Scroll to see all columns →
              </div>
              <div className="table-container orders-table-container" ref={tableRef}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Material</th>
                      <th>Size (m)</th>
                      <th>Repeats</th>
                      <th>Order Size</th>
                      <th>Price</th>
                      <th>Deposit</th>
                      <th>Remaining</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderPrice = parseFloat(order.totalPrice) || 0;
                      const orderDeposit = parseFloat(order.deposit) || 0;
                      const remaining = order.remainingAmount !== undefined
                        ? order.remainingAmount
                        : (orderPrice - orderDeposit);
                      return (
                        <tr key={order._id}>
                          <td>{order.clientName || order.clientSnapshot?.name || 'N/A'}</td>
                          <td>{order.material?.name || order.type || 'N/A'}</td>
                          <td>{order.sheetWidth} × {order.sheetHeight}</td>
                          <td>{order.repeats}</td>
                          <td>{order.orderSize?.toFixed(2) || '0.00'}</td>
                          <td>{orderPrice.toFixed(2)} EGP</td>
                          <td>{orderDeposit.toFixed(2)} EGP</td>
                          <td>{remaining.toFixed(2)} EGP</td>
                          <td>
                            <span className={`status-badge status-${order.orderState}`}>
                              {order.orderState}
                            </span>
                          </td>
                          <td className="actions">
                            {/* Designers and admin can edit orders */}
                            {['designer', 'admin'].includes(user?.role) && (
                              <button
                                type="button"
                                onClick={() => openEditOrderForm(order)}
                                className="btn-sm btn-edit"
                              >
                                Edit
                              </button>
                            )}
                            {/* Only admin can delete orders */}
                            {user?.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order)}
                                className="btn-sm btn-delete"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Summary Section */}
        <div className="form-section summary-section">
          <h2>Invoice Summary</h2>

          {/* Financial controls - only admin can edit */}
          {user?.role === 'admin' ? (
            <div className="summary-controls">
              <div className="form-group">
                <label>Tax (EGP)</label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Shipping (EGP)</label>
                <input
                  type="number"
                  name="shipping"
                  value={formData.shipping}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Discount (EGP)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Applied to the whole invoice total
                </small>
              </div>
            </div>
          ) : (
            <div className="summary-controls-readonly">
              <div className="form-group">
                <label>Tax (EGP)</label>
                <input
                  type="number"
                  value={formData.tax}
                  readOnly
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Shipping (EGP)</label>
                <input
                  type="number"
                  value={formData.shipping}
                  readOnly
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Discount (EGP)</label>
                <input
                  type="number"
                  value={formData.discount}
                  readOnly
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Applied to the whole invoice total
                </small>
              </div>
            </div>
          )}

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>{getDisplayTotals().subtotal.toFixed(2)} EGP</strong>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>{parseFloat(formData.tax || 0).toFixed(2)} EGP</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>{parseFloat(formData.shipping || 0).toFixed(2)} EGP</span>
            </div>
            <div className="summary-row">
              <span>Discount:</span>
              <span>-{parseFloat(formData.discount || 0).toFixed(2)} EGP</span>
            </div>
            <div className="summary-row total-row">
              <span>Total:</span>
              <strong>{getDisplayTotals().total.toFixed(2)} EGP</strong>
            </div>
            <div className="summary-row remaining-row">
              <span>Total Remaining:</span>
              <strong>{getDisplayTotals().totalRemaining.toFixed(2)} EGP</strong>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>

      {showOrderForm && (
        <OrderModal
          show={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          initialOrder={orderForm}
          materials={materials}
          products={products}
          clients={clients}
          user={user}
          onSave={handleSaveOrder}
        />
      )}

    </div>
  );
};

export default InvoiceForm;
