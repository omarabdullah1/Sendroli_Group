import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients({ search: searchTerm });
      setClients(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm]); // Changed dependency to searchTerm since that's what affects the fetch

  const handleSearch = () => {
    fetchClients();
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
      fetchClients();
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
        fetchClients();
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

        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name, phone, or factory name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} style={styles.searchButton}>
            Search
          </button>
        </div>

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
          <div style={styles.loading}>Loading...</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
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
                    <td colSpan="5" style={styles.noData}>
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client._id}>
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
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#ecf0f1',
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
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  searchBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  searchButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
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
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  formTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
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
    color: '#2c3e50',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
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
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    color: '#fff',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
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
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #ecf0f1',
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  editButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Clients;
