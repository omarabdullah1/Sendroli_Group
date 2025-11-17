import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'receptionist',
    password: '',
  });

  // Role-based permissions - only admin can manage users
  const canEdit = user?.role === 'admin';
  const canDelete = user?.role === 'admin';
  const canAdd = user?.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!canEdit) return;
    try {
      await userService.updateUser(userId, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd && !editingUser) return;
    if (!canEdit && editingUser) return;

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        await userService.updateUser(editingUser._id, updateData);
      } else {
        await userService.createUser(formData);
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', fullName: '', email: '', role: 'receptionist', password: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    if (!canEdit) return;
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      role: user.role,
      password: '', // Don't populate password for security
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!canDelete) return;
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ username: '', fullName: '', email: '', role: 'receptionist', password: '' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>User Management</h1>
          {canAdd && (
            <button onClick={() => setShowForm(true)} style={styles.addButton}>
              Add New User
            </button>
          )}
        </div>

        {showForm && (
          <div style={styles.formOverlay}>
            <div style={styles.formContainer}>
              <h2 style={styles.formTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="designer">Designer</option>
                    <option value="financial">Financial</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Password {editingUser ? '(leave empty to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitButton}>
                    {editingUser ? 'Update' : 'Create'}
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
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Full Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.noData}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>{user.fullName}</td>
                      <td style={styles.td}>{user.email || '-'}</td>
                      <td style={styles.td}>
                        <span style={getRoleStyle(user.role)}>{user.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={getStatusStyle(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(user._id, user.isActive)}
                              style={user.isActive ? styles.deactivateButton : styles.activateButton}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => handleEdit(user)} style={styles.editButton}>
                              Edit
                            </button>
                            {canDelete && (
                              <button onClick={() => handleDelete(user._id)} style={styles.deleteButton}>
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {!canEdit && (
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

const getRoleStyle = (role) => {
  const baseStyle = {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  };

  const colors = {
    admin: { backgroundColor: '#f8d7da', color: '#721c24' },
    receptionist: { backgroundColor: '#d1ecf1', color: '#0c5460' },
    designer: { backgroundColor: '#d4edda', color: '#155724' },
    financial: { backgroundColor: '#fff3cd', color: '#856404' },
  };

  return { ...baseStyle, ...colors[role] };
};

const getStatusStyle = (isActive) => {
  return {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: isActive ? '#d4edda' : '#f8d7da',
    color: isActive ? '#155724' : '#721c24',
  };
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
  activateButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  deactivateButton: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
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

export default Users;
