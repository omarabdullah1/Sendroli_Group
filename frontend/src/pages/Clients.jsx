import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/Loading';
import PageLoader from '../components/PageLoader';
import Pagination from '../components/Pagination';
import SearchAndFilters from '../components/SearchAndFilters';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';
import { formatDateTime } from '../utils/dateUtils';

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
      <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Client Management</h1>
          {canAdd && (
            <button onClick={() => setShowForm(true)} style={styles.addButton}>
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
          <div style={styles.formOverlay}>
            <div style={styles.formContainer}>
              <h2 style={styles.formTitle}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Factory Name</label>
                  <input
                    type="text"
                    value={formData.factoryName}
                    onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={styles.textarea}
                    rows="3"
                  />
                </div>

                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitButton}>
                    {editingClient ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <Loading message="Loading clients..." size="medium" />
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Factory Name</th>
                  <th style={styles.th}>Address</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.noData}>
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client._id}>
                      <td style={styles.td}>{formatDateTime(client.createdAt || client.date)}</td>
                      <td style={styles.td}>{client.name}</td>
                      <td style={styles.td}>{client.phone}</td>
                      <td style={styles.td}>{client.factoryName || '-'}</td>
                      <td style={styles.td}>{client.address || '-'}</td>
                      <td style={styles.td}>
                        {canEdit && (
                          <button onClick={() => handleEdit(client)} style={styles.editButton}>
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(client._id)} style={styles.deleteButton}>
                            Delete
                          </button>
                        )}
                        {!canEdit && !canDelete && (
                          <span style={{color: '#7f8c8d', fontStyle: 'italic'}}>View Only</span>
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

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: 'var(--bg-primary, #f0fdfd)',
    padding: '2rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary, #111827)',
  },
  addButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  searchBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  searchButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formContainer: {
    backgroundColor: 'var(--surface, #fff)',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
  },
  formTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary, #111827)',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    color: 'var(--text-primary, #111827)',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid var(--border-medium, #d1d5db)',
    borderRadius: '8px',
    fontSize: '1rem',
    resize: 'vertical',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  submitButton: {
    flex: 1,
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'var(--gray-400, #9ca3af)',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
  tableContainer: {
    backgroundColor: 'var(--surface, #fff)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
    border: '1px solid var(--border-light, #e5e7eb)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-light, #e5e7eb)',
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  editButton: {
    backgroundColor: 'var(--theme-primary, #00CED1)',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    backgroundColor: 'var(--error, #ef4444)',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
};

export default Clients;
