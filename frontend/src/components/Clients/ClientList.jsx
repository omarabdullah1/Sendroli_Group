import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services/clientService';
import './Clients.css';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await clientService.deleteClient(id);
      setClients(clients.filter((client) => client._id !== id));
    } catch (err) {
      setError('Failed to delete client');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="client-list">
      <div className="list-header">
        <h1>Clients</h1>
        <Link to="/clients/new" className="btn-primary">
          Add New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found. Add your first client!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Factory Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id}>
                  <td>{client.name}</td>
                  <td>{client.phone}</td>
                  <td>{client.factoryName}</td>
                  <td>{client.address || 'N/A'}</td>
                  <td className="actions">
                    <Link to={`/clients/${client._id}`} className="btn-view">
                      View
                    </Link>
                    <Link to={`/clients/edit/${client._id}`} className="btn-edit">
                      Edit
                    </Link>
                    {user?.role === 'Admin' && (
                      <button
                        onClick={() => handleDelete(client._id)}
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
      )}
    </div>
  );
};

export default ClientList;
