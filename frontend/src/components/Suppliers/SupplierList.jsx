import { useEffect, useState } from 'react';
import { supplierService } from '../../services/supplierService';
import { formatDateTime } from '../../utils/dateUtils';
import { useDragScroll } from '../../hooks/useDragScroll';
import Loading from '../Loading';
import './SupplierList.css';

const SupplierList = ({ onEdit, onDelete }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const tableRef = useDragScroll();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll({
        page: currentPage,
        limit: 10,
        search
      });
      setSuppliers(response.data.data.suppliers);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectSupplier = (supplierId) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSuppliers(suppliers.map(supplier => supplier._id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedSuppliers.length} suppliers?`)) {
      try {
        await Promise.all(selectedSuppliers.map(id => supplierService.delete(id)));
        setSelectedSuppliers([]);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting suppliers:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-badge active',
      inactive: 'status-badge inactive'
    };
    return statusClasses[status] || 'status-badge';
  };

  const formatPaymentTerms = (terms) => {
    const termLabels = {
      'cash': 'Cash',
      'net30': 'Net 30',
      'net60': 'Net 60',
      'credit': 'Credit'
    };
    return termLabels[terms] || terms;
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="supplier-list">
        <Loading message="Loading suppliers..." size="medium" />
      </div>
    );
  }

  return (
    <div className="supplier-list">
      {/* Search and Actions */}
      <div className="list-header">
        <div className="search-bar">
          <div className="search-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        {selectedSuppliers.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedSuppliers.length} selected</span>
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      {suppliers.length === 0 ? (
        <div className="empty-state">
          {/* Empty state icon removed for unified design */}
          <h3>No suppliers found</h3>
          <p>Start by adding your first supplier to manage your inventory</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <div className="table-container" ref={tableRef}>
              <table className="data-table">
                <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.length === suppliers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Materials</th>
                  <th>Payment Terms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.includes(supplier._id)}
                        onChange={() => handleSelectSupplier(supplier._id)}
                      />
                    </td>
                    <td>{formatDateTime(supplier.createdAt || supplier.date)}</td>
                    <td>
                      <div className="supplier-info">
                        <h4>{supplier.name}</h4>
                        {supplier.company && <p className="company">{supplier.company}</p>}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div>{supplier.phone}</div>
                        <div className="email">{supplier.email}</div>
                        {supplier.address && (
                          <div className="address">{supplier.address}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="materials-supplied">
                        {supplier.materialsSupplied && supplier.materialsSupplied.length > 0 ? (
                          <div className="materials-list">
                            {supplier.materialsSupplied.slice(0, 2).map((material, index) => (
                              <span key={index} className="material-tag">
                                {material}
                              </span>
                            ))}
                            {supplier.materialsSupplied.length > 2 && (
                              <span className="more-materials">
                                +{supplier.materialsSupplied.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="no-materials">No materials specified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="payment-terms">
                        {formatPaymentTerms(supplier.paymentTerms)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(supplier.status)}>
                        {supplier.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEdit(supplier)}
                          title="Edit supplier"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(supplier)}
                          title="Delete supplier"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {loading && suppliers.length > 0 && (
        <div className="loading-overlay-wrapper">
          <Loading size="small" />
        </div>
      )}
    </div>
  );
};

export default SupplierList;