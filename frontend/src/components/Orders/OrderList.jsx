import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services/clientService';
import { materialService } from '../../services/materialService';
import { orderService } from '../../services/orderService';
import Loading from '../Loading';
import Pagination from '../Pagination';
import SearchAndFilters from '../SearchAndFilters';
import OrderModal from './OrderModal';
import './Orders.css';

const OrderList = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();
  // Modal state for inline create/edit
  const [showModal, setShowModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const tableContainerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    fetchAllOrders();
    loadClients();
    loadMaterials();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 });
      const data = response.data?.data?.materials || response.data;
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchTerm]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [allOrders, selectedStatus, searchTerm, currentPage]);

  // Drag to scroll functionality
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 2; // Scroll speed multiplier
      container.scrollLeft = scrollLeft.current - walk;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({});
      const data = Array.isArray(response) ? response : response.data || [];
      setAllOrders(data);
      setError('');
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    try {
      let filteredOrders = [...allOrders];
      
      // Status filter
      if (selectedStatus) {
        filteredOrders = filteredOrders.filter(order => 
          (order.orderState || order.status) === selectedStatus
        );
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order => {
          const clientName = order.client?.name || order.clientSnapshot?.name || '';
          const orderType = order.type || '';
          return (
            clientName.toLowerCase().includes(searchLower) ||
            orderType.toLowerCase().includes(searchLower)
          );
        });
      }

      // Calculate pagination
      const total = filteredOrders.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
    } catch (err) {
      console.error('Error applying filters:', err);
      setOrders([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await orderService.deleteOrder(id);
      fetchAllOrders();
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handleModalSave = async (payload) => {
    try {
      // Update existing
      if (modalOrder && modalOrder._id) {
        await orderService.updateOrder(modalOrder._id, payload);
      } else {
        await orderService.createOrder(payload);
      }
      setShowModal(false);
      // Refresh list
      await fetchAllOrders();
    } catch (err) {
      console.error('Failed to save order from modal:', err);
      // Let the modal's onSave handler catch and show the error
      throw err;
    }
  };

  if (loading) return <Loading message="Loading orders..." size="medium" />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="order-list">
      <div className="list-header">
        <h1>Orders</h1>
        {user?.role === 'admin' && (
          <>
            <button
              className="btn-primary"
              type="button"
              onClick={() => { setModalOrder(null); setShowModal(true); }}
            >
              + Add Order
            </button>
            {/* Keep deep linking for other contexts (hidden). */}
            <Link to="/orders/new" state={{ openModal: true }} style={{ display: 'none' }} />
          </>
        )}
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showClientFilter={false}
        states={[
          { value: '', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'active', label: 'Active' },
          { value: 'done', label: 'Done' },
          { value: 'delivered', label: 'Delivered' },
        ]}
        selectedState={selectedStatus}
        onStateChange={setSelectedStatus}
        showDateFilters={false}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search by client name or order type..."
      />

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found. Create your first order!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-container" ref={tableContainerRef}>
            <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Height (m)</th>
                <th>Order Size (m)</th>
                <th>Repeats</th>
                {/* Show financial columns only for financial roles */}
                {['financial', 'admin'].includes(user?.role) && (
                  <>
                    <th>Price</th>
                    <th>Deposit</th>
                    <th>Balance</th>
                  </>
                )}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.client?.name || order.clientSnapshot?.name || 'N/A'}</td>
                  <td>{order.type}</td>
                  <td>{order.sheetHeight || order.size}</td>
                  <td>{((order.orderSize ? order.orderSize : (Number(order.repeats) * Number(order.sheetHeight || 0))))?.toFixed(2) || '0.00'} m</td>
                  <td>{order.repeats}</td>
                  
                  {/* Show financial columns only for financial roles */}
                  {['financial', 'admin'].includes(user?.role) && (
                    <>
                      <td>{order.totalPrice || order.price || 0} EGP</td>
                      <td>{order.deposit || 0} EGP</td>
                      <td>{(order.remainingAmount || order.balance || ((order.totalPrice || order.price || 0) - (order.deposit || 0)))} EGP</td>
                    </>
                  )}
                  
                  <td>
                    <span className={`status-badge status-${order.orderState || order.status}`}>
                      {order.orderState || order.status}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/orders/${order._id}`} className="btn-view">
                      View
                    </Link>
                    
                    {['designer', 'worker', 'financial', 'admin'].includes(user?.role) && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => { setModalOrder(order); setShowModal(true); }}
                      >
                        {user?.role === 'worker' ? 'Update Status' : 'Edit'}
                      </button>
                    )}
                    
                    {['designer', 'worker'].includes(user?.role) && order.designLink && (
                      <a 
                        href={order.designLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-design"
                      >
                        View Design
                      </a>
                    )}
                    
                    {user?.role === 'worker' && !order.designLink && (
                      <button 
                        className="btn-design disabled"
                        title="No design available yet"
                        disabled
                      >
                        No Design
                      </button>
                    )}
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(order._id)}
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
        </div>
      )}

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
        {showModal && (
          <OrderModal
            show={showModal}
            onClose={() => setShowModal(false)}
            initialOrder={modalOrder || {}}
            materials={materials}
            clients={clients}
            user={user}
            onSave={handleModalSave}
          />
        )}
    </div>
  );
};

export default OrderList;
