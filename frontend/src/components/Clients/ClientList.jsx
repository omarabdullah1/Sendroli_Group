import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientService from '../../services/clientService';
import Loading from '../Loading';
import SearchAndFilters from '../SearchAndFilters';
import Pagination from '../Pagination';
import { useDragScroll } from '../../hooks/useDragScroll';
import './Clients.css';

const ClientList = () => {
  const [allClients, setAllClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();
  const tableRef = useDragScroll();

  useEffect(() => {
    fetchAllClients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [allClients, searchTerm, currentPage]);

  const fetchAllClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients();
      setAllClients(data || []);
      setError('');
    } catch (err) {
      setError('Failed to load clients');
      console.error(err);
      setAllClients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    try {
      let filteredClients = [...allClients];
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredClients = filteredClients.filter(client =>
          client.name?.toLowerCase().includes(searchLower) ||
          client.phone?.toLowerCase().includes(searchLower) ||
          client.factoryName?.toLowerCase().includes(searchLower)
        );
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
    } catch (err) {
      console.error('Error applying filters:', err);
      setClients([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await clientService.deleteClient(id);
      fetchAllClients();
    } catch (err) {
      setError('Failed to delete client');
      console.error(err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) return <Loading message="Loading clients..." size="medium" />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="client-list">
      <div className="list-header">
        <h1>Clients</h1>
        {['receptionist', 'admin'].includes(user?.role) && (
          <Link to="/clients/new" className="btn-primary">
            Add New Client
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showClientFilter={false}
        showStateFilter={false}
        showDateFilters={false}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search by name, phone, or factory name..."
      />

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found. Add your first client!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-container" ref={tableRef}>
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
                      
                      {['receptionist', 'admin'].includes(user?.role) && (
                        <Link to={`/clients/edit/${client._id}`} className="btn-edit">
                          Edit
                        </Link>
                      )}
                      
                      {user?.role === 'admin' && (
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
  );
};

export default ClientList;
