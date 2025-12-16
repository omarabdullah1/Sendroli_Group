import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/Loading';
import PageLoader from '../components/PageLoader';
import Pagination from '../components/Pagination';
import SearchAndFilters from '../components/SearchAndFilters';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';
import { formatDateTime } from '../utils/dateUtils';
import './Clients.css';


const Clients = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [allClients, setAllClients] = useState([]); // Store all fetched clients
  const [clients, setClients] = useState([]); // Displayed clients (filtered + paginated)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    factoryName: '',
    address: '',
    notes: '',
  });

  // Role-based permissions
  const canEdit = user?.role === 'admin' || user?.role === 'receptionist';
  const canDelete = user?.role === 'admin';
  const canAdd = user?.role === 'admin' || user?.role === 'receptionist';

  // Set search term from navigation state if provided
  useEffect(() => {
    if (location.state?.searchTerm) {
      setSearchTerm(location.state.searchTerm);
    }
  }, [location.state]);

  // Fetch all clients once
  const fetchAllClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients({ limit: 10000 });
      setAllClients(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clients');
      setAllClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = useCallback(() => {
    let filteredClients = [...allClients];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredClients = filteredClients.filter(client => {
        const name = client.name || '';
        const phone = client.phone || '';
        const factoryName = client.factoryName || '';
        const address = client.address || '';

        return (
          name.toLowerCase().includes(searchLower) ||
          phone.toLowerCase().includes(searchLower) ||
          factoryName.toLowerCase().includes(searchLower) ||
          address.toLowerCase().includes(searchLower)
        );
      });
    }

    // Date range filter
    if (startDate || endDate) {
      filteredClients = filteredClients.filter(client => {
        const clientDate = new Date(client.createdAt || client.date);
        if (startDate && clientDate < new Date(startDate)) return false;
        if (endDate && clientDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
    }

    // Calculate pagination
    const total = filteredClients.length;
    setTotalItems(total);
    setTotalPages(Math.ceil(total / itemsPerPage) || 1);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    setClients(paginatedClients);
  }, [allClients, searchTerm, startDate, endDate, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [applyFiltersAndPagination]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd && !editingClient) return;
    if (!canEdit && editingClient) return;

    try {
      if (editingClient) {
        await clientService.updateClient(editingClient._id, formData);
      } else {
        await clientService.createClient(formData);
      }
      setShowForm(false);
      setEditingClient(null);
      setFormData({ name: '', phone: '', factoryName: '', address: '', notes: '' });
      fetchAllClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (client) => {
    if (!canEdit) return;
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      factoryName: client.factoryName || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.deleteClient(id);
        fetchAllClients();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete client');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', phone: '', factoryName: '', address: '', notes: '' });
  };

  return (
    <PageLoader
      loading={loading}
      loadingMessage="Loading clients..."
      onLoadComplete={() => console.log('Clients page loaded')}
    >
      <div className="clients-container">
        <div className="clients-content">
          <div className="clients-header">
            <h1 className="clients-title">Client Management</h1>
            {canAdd && (
              <button onClick={() => setShowForm(true)} className="add-client-btn">
                Add New Client
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <SearchAndFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showClientFilter={false}
            showStateFilter={false}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
            searchPlaceholder="Search by name, phone, or factory name..."
          />

          {showForm && (
            <div className="form-overlay">
              <div className="form-container">
                <h2 className="form-title">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <form onSubmit={handleSubmit} className="client-form">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Factory Name</label>
                    <input
                      type="text"
                      value={formData.factoryName}
                      onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="submit-btn">
                      {editingClient ? 'Update' : 'Create'}
                    </button>
                    <button type="button" onClick={handleCancel} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <Loading message="Loading clients..." size="medium" />
          ) : (
            <div className="table-container">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Factory Name</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data-cell">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client._id}>
                        <td data-label="Date">{formatDateTime(client.createdAt || client.date)}</td>
                        <td data-label="Name">{client.name}</td>
                        <td data-label="Phone">{client.phone}</td>
                        <td data-label="Factory Name">{client.factoryName || '-'}</td>
                        <td data-label="Address">{client.address || '-'}</td>
                        <td data-label="Actions">
                          {canEdit && (
                            <button onClick={() => handleEdit(client)} className="edit-btn">
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(client._id)} className="delete-btn">
                              Delete
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="view-only-text">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && clients.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </PageLoader>
  );
};

export default Clients;
