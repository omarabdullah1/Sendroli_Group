import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientService from '../../services/clientService';
import invoiceService from '../../services/invoiceService';
import { materialService } from '../../services/materialService';
import orderService from '../../services/orderService';
import './Invoices.css';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
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
      // Get all materials first
      const response = await materialService.getAll();
      console.log('Materials API response:', response);
      
      // Handle different response structures
      let data = [];
      if (response.data) {
        if (response.data.data && response.data.data.materials) {
          data = response.data.data.materials;
        } else if (response.data.materials) {
          data = response.data.materials;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
      } else if (Array.isArray(response)) {
        data = response;
      }
      
      console.log('Materials data:', data);
      
      // Filter materials that are marked as order types, or use all if none are marked
      const orderTypeMaterials = data.filter(m => m.isOrderType === true);
      
      // If no materials are marked as order types, show all materials
      const materialsToShow = orderTypeMaterials.length > 0 ? orderTypeMaterials : data;
      
      setMaterials(materialsToShow);
      console.log('Loaded materials for orders:', materialsToShow.length, materialsToShow);
    } catch (err) {
      console.error('Failed to load materials:', err);
      setMaterials([]);
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(id);
      const invoice = response.data;
      
      const clientId = invoice.client?._id || invoice.client || '';
      const clientName = invoice.client?.name || invoice.clientSnapshot?.name || '';
      
      setFormData({
        client: clientId,
        invoiceDate: new Date(invoice.invoiceDate).toISOString().slice(0, 16),
        tax: invoice.tax || 0,
        shipping: invoice.shipping || 0,
        discount: invoice.discount || 0,
        status: invoice.status || 'draft',
        notes: invoice.notes || '',
      });
      
      // Set invoice client name for order forms
      setInvoiceClientName(clientName);
      
      // Load orders separately
      setOrders(invoice.orders || []);
      
      // Store backend-calculated totals for existing invoices
      if (isEditMode) {
        setInvoiceTotals({
          subtotal: invoice.subtotal || 0,
          total: invoice.total || 0,
          totalRemaining: invoice.totalRemaining || 0,
        });
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Update invoice client name when client is selected
    if (name === 'client') {
      const selectedClient = clients.find(c => c._id === value);
      if (selectedClient) {
        setInvoiceClientName(selectedClient.name);
      }
    }
    
    // Clear backend totals when financial fields change to trigger real-time calculation
    if (['tax', 'shipping', 'discount'].includes(name) && isEditMode) {
      setInvoiceTotals(null);
      // Optionally auto-update the invoice when financial fields change
      if (id && ['tax', 'shipping', 'discount'].includes(name)) {
        // Debounce the update to avoid too many API calls
        clearTimeout(window.invoiceUpdateTimeout);
        window.invoiceUpdateTimeout = setTimeout(async () => {
          try {
            const updateData = {
              [name]: parseFloat(value) || 0
            };
            await invoiceService.updateInvoice(id, updateData);
            // Reload to get updated backend totals
            await loadInvoice();
          } catch (err) {
            console.error('Failed to auto-update invoice:', err);
          }
        }, 1000); // Wait 1 second after user stops typing
      }
    }
  };

  const handleOrderInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // Helper function to calculate total size
      const calculateTotalSize = (form) => {
        const { repeats, sheetWidth, sheetHeight } = form;
        if (!repeats || !sheetWidth || !sheetHeight) return 0;
        return parseFloat(repeats) * parseFloat(sheetWidth) * parseFloat(sheetHeight);
      };
      
      // Recalculate price if material is selected and size fields change
      const shouldRecalculatePrice = 
        name === 'material' || 
        name === 'repeats' || 
        name === 'sheetWidth' || 
        name === 'sheetHeight';
      
      if (shouldRecalculatePrice) {
        const materialId = name === 'material' ? value : updated.material;
        if (materialId) {
          const selectedMaterial = materials.find(m => m._id === materialId);
          if (selectedMaterial && selectedMaterial.sellingPrice) {
            const totalSize = calculateTotalSize(updated);
            if (totalSize > 0) {
              // Calculate price as selling price per cm * total size
              updated.totalPrice = parseFloat(selectedMaterial.sellingPrice) * totalSize;
              console.log('Price recalculated:', selectedMaterial.sellingPrice, 'x', totalSize, '=', updated.totalPrice);
            } else {
              // If size is not available yet, use selling price directly
              updated.totalPrice = parseFloat(selectedMaterial.sellingPrice) || 0;
            }
          } else if (name === 'material' && value) {
            updated.totalPrice = 0;
            console.warn('Selected material has no selling price');
          }
        }
      }
      
      // Prevent manual price editing when material is selected
      if (name === 'totalPrice' && updated.material) {
        // If material is selected, ignore manual price changes and recalculate from material
        const selectedMaterial = materials.find(m => m._id === updated.material);
        if (selectedMaterial && selectedMaterial.sellingPrice) {
          const totalSize = calculateTotalSize(updated);
          if (totalSize > 0) {
            updated.totalPrice = parseFloat(selectedMaterial.sellingPrice) * totalSize;
          } else {
            updated.totalPrice = parseFloat(selectedMaterial.sellingPrice) || 0;
          }
        }
      }
      
      return updated;
    });
  };

  const calculateOrderSize = () => {
    const { repeats, sheetWidth, sheetHeight } = orderForm;
    if (!repeats || !sheetWidth || !sheetHeight) return 0;
    return repeats * sheetWidth * sheetHeight;
  };

  const getStockStatus = () => {
    if (!orderForm.material) {
      return null;
    }
    
    const selectedMaterial = materials.find(m => m._id === orderForm.material);
    if (!selectedMaterial) {
      return null;
    }
    
    const requiredStock = calculateOrderSize();
    const availableStock = selectedMaterial.currentStock || 0;
    const isEnough = availableStock >= requiredStock;
    
    return {
      materialName: selectedMaterial.name,
      unit: selectedMaterial.unit || 'cm²',
      required: requiredStock,
      available: availableStock,
      isEnough: isEnough,
      shortage: isEnough ? 0 : requiredStock - availableStock,
    };
  };

  const calculateOrderRemaining = () => {
    return (orderForm.totalPrice || 0) - (orderForm.deposit || 0);
  };

  const openAddOrderForm = () => {
    // Get client name from selected invoice client
    let clientName = invoiceClientName;
    
    // If not set from invoice, try to get from selected client
    if (!clientName && formData.client) {
      const selectedClient = clients.find(c => c._id === formData.client);
      if (selectedClient) {
        clientName = selectedClient.name;
        // Update invoiceClientName state for consistency
        setInvoiceClientName(selectedClient.name);
      }
    }
    
    // If still no client name and no client selected, show warning
    if (!clientName && !formData.client) {
      alert('Please select a client for the invoice first before adding orders.');
      return;
    }
    
    setOrderForm({
      clientName: clientName || '',
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
      repeats: order.repeats,
      totalPrice: order.totalPrice,
      deposit: order.deposit,
      orderState: order.orderState,
      notes: order.notes || '',
      designLink: order.designLink || '',
    });
    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const handleSaveOrder = async () => {
    if (!orderForm.clientName || !orderForm.sheetWidth || !orderForm.sheetHeight) {
      alert('Please fill in all required order fields');
      return;
    }

    // Validate material is selected
    if (!orderForm.material) {
      alert('Please select a material type');
      return;
    }

    // Calculate order price from material selling price * total size
    let orderPrice = parseFloat(orderForm.totalPrice) || 0;
    if (orderForm.material) {
      const selectedMaterial = materials.find(m => m._id === orderForm.material);
      if (selectedMaterial && selectedMaterial.sellingPrice) {
        const totalSize = calculateOrderSize();
        if (totalSize > 0) {
          orderPrice = parseFloat(selectedMaterial.sellingPrice) * totalSize;
        } else {
          orderPrice = parseFloat(selectedMaterial.sellingPrice) || 0;
        }
      }
    }

    if (orderPrice === 0) {
      alert('Material has no selling price. Please set a price for the material or select a different material.');
      return;
    }

    if (!isEditMode || !id) {
      // Get material object for display
      const selectedMaterial = materials.find(m => m._id === orderForm.material);
      
      // If creating a new invoice, just add to local state
      const newOrder = {
        _id: `temp-${Date.now()}`,
        clientName: orderForm.clientName,
        material: selectedMaterial ? { _id: orderForm.material, name: selectedMaterial.name } : orderForm.material,
        sheetWidth: parseFloat(orderForm.sheetWidth),
        sheetHeight: parseFloat(orderForm.sheetHeight),
        repeats: parseInt(orderForm.repeats) || 1,
        totalPrice: orderPrice,
        deposit: parseFloat(orderForm.deposit) || 0,
        remainingAmount: orderPrice - (parseFloat(orderForm.deposit) || 0),
        orderSize: calculateOrderSize(),
        orderState: orderForm.orderState,
        notes: orderForm.notes,
        designLink: orderForm.designLink,
      };
      
      console.log('Adding order with price:', newOrder.totalPrice, 'material:', newOrder.material);

      if (editingOrder) {
        setOrders(orders.map(o => o._id === editingOrder._id ? { ...newOrder, _id: editingOrder._id } : o));
      } else {
        setOrders([...orders, newOrder]);
      }
    } else {
      // If editing existing invoice, save order to database
      try {
        // Calculate order price from material selling price * total size
        let orderPrice = parseFloat(orderForm.totalPrice) || 0;
        if (orderForm.material) {
          const selectedMaterial = materials.find(m => m._id === orderForm.material);
          if (selectedMaterial && selectedMaterial.sellingPrice) {
            const totalSize = calculateOrderSize();
            if (totalSize > 0) {
              orderPrice = parseFloat(selectedMaterial.sellingPrice) * totalSize;
            } else {
              orderPrice = parseFloat(selectedMaterial.sellingPrice) || 0;
            }
          }
        }

        const orderData = {
          client: formData.client, // Include invoice client ID
          clientName: orderForm.clientName,
          material: orderForm.material,
          sheetWidth: parseFloat(orderForm.sheetWidth),
          sheetHeight: parseFloat(orderForm.sheetHeight),
          repeats: parseInt(orderForm.repeats) || 1,
          totalPrice: orderPrice,
          deposit: parseFloat(orderForm.deposit) || 0,
          orderState: orderForm.orderState,
          notes: orderForm.notes,
          designLink: orderForm.designLink,
          invoice: id,
        };
        
        console.log('🔧 FRONTEND ORDER DATA DEBUG:', {
          materialId: orderForm.material,
          selectedMaterial: materials.find(m => m._id === orderForm.material),
          repeats: parseInt(orderForm.repeats) || 1,
          sheetWidth: parseFloat(orderForm.sheetWidth),
          sheetHeight: parseFloat(orderForm.sheetHeight),
          totalSize: calculateOrderSize(),
          calculatedPrice: orderPrice,
          orderDataBeingSent: orderData
        });

        if (editingOrder && !editingOrder._id.startsWith('temp-')) {
          // Update existing order
          await orderService.updateOrder(editingOrder._id, orderData);
        } else {
          // Create new order
          await orderService.createOrder(orderData);
        }
        
        // Reload invoice to get updated totals and orders
        await loadInvoice();
      } catch (err) {
        // Enhanced error message with material stock details if available
        let errorMessage = 'Failed to save order: ' + (err.response?.data?.message || err.message);
        
        if (err.response?.data?.materialInfo) {
          const info = err.response.data.materialInfo;
          errorMessage += `\n\n📦 Material Stock Details:`;
          errorMessage += `\n• Material: ${info.name}`;
          errorMessage += `\n• Required: ${info.required.toFixed(2)} ${info.unit}`;
          errorMessage += `\n• Available: ${info.available.toFixed(2)} ${info.unit}`;
          errorMessage += `\n• Shortage: ${info.shortage.toFixed(2)} ${info.unit}`;
          errorMessage += `\n• Stock Status: ${info.status}`;
        }
        
        alert(errorMessage);
        return;
      }
    }

    setShowOrderForm(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    if (isEditMode && !order._id.startsWith('temp-')) {
      // Delete from database
      try {
        await orderService.deleteOrder(order._id);
        // Reload invoice to get updated totals and orders
        await loadInvoice();
      } catch (err) {
        alert('Failed to delete order: ' + (err.response?.data?.message || err.message));
      }
    } else {
      // Remove from local state for new invoices
      setOrders(orders.filter(o => o._id !== order._id));
    }
  };

  const calculateSubtotal = () => {
    // Subtotal: Raw sum of all order prices (before deposit, discount, shipping, tax)
    const subtotal = orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice) || 0;
      return sum + price;
    }, 0);
    console.log('Calculating subtotal:', orders.length, 'orders, subtotal:', subtotal);
    return subtotal;
  };

  const calculateTotal = () => {
    // Total: Subtotal + Tax + Shipping - Discount (after discount, shipping, tax, but before deposits)
    const subtotal = calculateSubtotal();
    const tax = parseFloat(formData.tax) || 0;
    const shipping = parseFloat(formData.shipping) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + tax + shipping - discount;
    console.log('Calculating total:', { subtotal, tax, shipping, discount, total });
    return total;
  };

  const calculateTotalRemaining = () => {
    // Total Remaining: Total - Total Deposits (after deposit, discount, shipping, tax)
    // This is the amount the customer still owes
    const invoiceTotal = calculateTotal();
    const totalDeposits = orders.reduce((sum, order) => {
      return sum + parseFloat(order.deposit || 0);
    }, 0);
    const remaining = invoiceTotal - totalDeposits;
    console.log('Calculating total remaining:', { invoiceTotal, totalDeposits, remaining });
    return remaining;
  };

  // Get display totals - use backend totals if available and financial fields haven't changed
  const getDisplayTotals = () => {
    // If we have backend totals and financial fields haven't been modified, use backend values
    if (isEditMode && invoiceTotals !== null) {
      return invoiceTotals;
    }
    // Otherwise calculate frontend totals
    return {
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      totalRemaining: calculateTotalRemaining()
    };
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
            {/* Admin, worker, and designer can add orders */}
            {['admin', 'worker', 'designer'].includes(user?.role) && (
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
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Material</th>
                    <th>Size (cm)</th>
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
                          {/* Designers, workers, and admin can edit orders */}
                          {['designer', 'worker', 'admin'].includes(user?.role) && (
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

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Hide client name field completely - it's auto-filled from invoice client */}
              {/* Only show if no client is selected (shouldn't happen, but safety check) */}
              {!formData.client && !invoiceClientName && (
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="clientName"
                    value={orderForm.clientName}
                    onChange={handleOrderInputChange}
                    required
                  />
                </div>
              )}
              
              {/* Always ensure clientName is set when invoice has a client */}
              {(formData.client || invoiceClientName) && orderForm.clientName && (
                <input
                  type="hidden"
                  name="clientName"
                  value={orderForm.clientName}
                />
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Material Type *</label>
                  <select
                    name="material"
                    value={orderForm.material}
                    onChange={handleOrderInputChange}
                    required
                  >
                    <option value="">Select Material</option>
                    {materials.map((material) => (
                      <option key={material._id} value={material._id}>
                        {material.name} {material.sellingPrice ? `(${material.sellingPrice} EGP)` : ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Price will be set automatically from material
                  </small>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="orderState"
                    value={orderForm.orderState}
                    onChange={handleOrderInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="done">Done</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sheet Width (cm) *</label>
                  <input
                    type="number"
                    name="sheetWidth"
                    value={orderForm.sheetWidth}
                    onChange={handleOrderInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sheet Height (cm) *</label>
                  <input
                    type="number"
                    name="sheetHeight"
                    value={orderForm.sheetHeight}
                    onChange={handleOrderInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Repeats *</label>
                  <input
                    type="number"
                    name="repeats"
                    value={orderForm.repeats}
                    onChange={handleOrderInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="order-size-display">
                <strong>Order Size:</strong> {calculateOrderSize().toFixed(2)} cm²
              </div>

              {/* Stock Status Indicator */}
              {(() => {
                const stockStatus = getStockStatus();
                if (!stockStatus || stockStatus.required === 0) return null;
                
                return (
                  <div 
                    className="stock-status-indicator"
                    style={{
                      padding: '12px',
                      marginTop: '8px',
                      borderRadius: '6px',
                      backgroundColor: stockStatus.isEnough ? '#d1fae5' : '#fee2e2',
                      border: `2px solid ${stockStatus.isEnough ? '#059669' : '#dc2626'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {stockStatus.isEnough ? '✓' : '⚠️'}
                      </span>
                      <strong style={{ color: stockStatus.isEnough ? '#059669' : '#dc2626' }}>
                        {stockStatus.isEnough ? 'Stock Available' : 'Insufficient Stock'}
                      </strong>
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                      <div><strong>Material:</strong> {stockStatus.materialName}</div>
                      <div><strong>Required:</strong> {stockStatus.required.toFixed(2)} {stockStatus.unit}</div>
                      <div><strong>Available:</strong> {stockStatus.available.toFixed(2)} {stockStatus.unit}</div>
                      {!stockStatus.isEnough && (
                        <div style={{ marginTop: '4px', fontWeight: '600', color: '#dc2626' }}>
                          <strong>Shortage:</strong> {stockStatus.shortage.toFixed(2)} {stockStatus.unit}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Price fields - Auto-calculated from material, not editable */}
              <div className="form-row">
                <div className="form-group">
                  <label>Total Price (EGP) *</label>
                  {(() => {
                    const selectedMaterial = orderForm.material ? materials.find(m => m._id === orderForm.material) : null;
                    const materialPrice = selectedMaterial?.sellingPrice || 0;
                    const displayPrice = orderForm.material ? materialPrice : (orderForm.totalPrice || 0);
                    
                    // Always read-only when material is selected (price comes from material)
                    if (orderForm.material) {
                      return (
                        <input
                          type="number"
                          value={displayPrice}
                          readOnly
                          style={{ backgroundColor: '#e7f3ff', cursor: 'not-allowed' }}
                          title="Price is automatically set from selected material"
                        />
                      );
                    }
                    
                    // Only allow manual price entry if no material selected (admin only)
                    return user?.role === 'admin' ? (
                      <input
                        type="number"
                        name="totalPrice"
                        value={displayPrice}
                        onChange={handleOrderInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    ) : (
                      <input
                        type="number"
                        value={displayPrice}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                      />
                    );
                  })()}
                  {orderForm.material && (() => {
                    const selectedMaterial = materials.find(m => m._id === orderForm.material);
                    return selectedMaterial ? (
                      <small style={{ color: '#0066cc', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Price automatically set from material: {selectedMaterial.sellingPrice || 0} EGP
                      </small>
                    ) : (
                      <small style={{ color: '#ff0000', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Material has no selling price. Please set a price for this material.
                      </small>
                    );
                  })()}
                </div>

                <div className="form-group">
                  <label>Deposit (EGP)</label>
                  {user?.role === 'admin' ? (
                    <input
                      type="number"
                      name="deposit"
                      value={orderForm.deposit}
                      onChange={handleOrderInputChange}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <input
                      type="number"
                      value={orderForm.deposit || 0}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  )}
                </div>
              </div>

              <div className="remaining-display">
                <strong>Remaining:</strong> {calculateOrderRemaining().toFixed(2)} EGP
              </div>

              <div className="form-group">
                <label>Design Link</label>
                <input
                  type="url"
                  name="designLink"
                  value={orderForm.designLink}
                  onChange={handleOrderInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={orderForm.notes}
                  onChange={handleOrderInputChange}
                  rows="3"
                  placeholder="Add order notes..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                className="btn-primary"
              >
                {editingOrder ? 'Update Order' : 'Add Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
