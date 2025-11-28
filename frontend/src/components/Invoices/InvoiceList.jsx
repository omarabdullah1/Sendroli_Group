import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import invoiceService from '../../services/invoiceService';
import clientService from '../../services/clientService';
import Loading from '../Loading';
import SearchAndFilters from '../SearchAndFilters';
import Pagination from '../Pagination';
import './Invoices.css';

const InvoiceList = () => {
  const [allInvoices, setAllInvoices] = useState([]); // Store all fetched invoices
  const [invoices, setInvoices] = useState([]); // Displayed invoices (filtered + paginated)
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
    fetchAllInvoices();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatus, selectedClient, startDate, endDate, searchTerm]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [allInvoices, selectedStatus, selectedClient, startDate, endDate, searchTerm, currentPage]);

  const fetchClients = async () => {
    try {
      const response = await clientService.getClients();
      setClients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  // Fetch all invoices once
  const fetchAllInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices({ limit: 10000 });
      setAllInvoices(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
      setAllInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination on client-side
  const applyFiltersAndPagination = () => {
    try {
      let filteredInvoices = [...allInvoices];
      
      // Status filter
      if (selectedStatus) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.status === selectedStatus
        );
      }
      
      // Client filter
      if (selectedClient) {
        filteredInvoices = filteredInvoices.filter(invoice =>
          invoice.client?._id === selectedClient || 
          invoice.clientSnapshot?.name?.toLowerCase().includes(selectedClient.toLowerCase())
        );
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceNumber = invoice.invoiceNumber || invoice._id?.slice(-6) || '';
          const clientName = invoice.client?.name || invoice.clientSnapshot?.name || '';
          return (
            invoiceNumber.toLowerCase().includes(searchLower) ||
            clientName.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Date range filter
      if (startDate || endDate) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt);
          if (startDate && invoiceDate < new Date(startDate)) return false;
          if (endDate && invoiceDate > new Date(endDate + 'T23:59:59')) return false;
          return true;
        });
      }

      // Calculate pagination
      const total = filteredInvoices.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

      setInvoices(paginatedInvoices);
    } catch (err) {
      console.error('Error applying filters:', err);
      setInvoices([]);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedClient('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice? All orders within will be removed.')) {
      return;
    }

    try {
      await invoiceService.deleteInvoice(id);
      fetchAllInvoices(); // Reload all data
    } catch (err) {
      setError('Failed to delete invoice');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return '-';
    }
  };

  if (loading) return <Loading message="Loading invoices..." size="medium" />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="invoice-list">
      <div className="list-header">
        <h1>Invoices</h1>
        {['admin', 'designer'].includes(user?.role) && (
          <Link to="/invoices/new" className="btn-primary">
            Add Invoice
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        states={[
          { value: '', label: 'All Status' },
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        selectedState={selectedStatus}
        onStateChange={setSelectedStatus}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search by invoice number or client name..."
      />

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>No invoices found. Create your first invoice!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Created</th>
                <th>Orders</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>#{invoice._id.slice(-6).toUpperCase()}</td>
                  <td>{invoice.client?.name || invoice.clientSnapshot?.name || 'N/A'}</td>
                  <td>{formatDate(invoice.invoiceDate)}</td>
                  <td>{formatDateTime(invoice.createdAt || invoice.date)}</td>
                  <td>{invoice.orderCount || 0}</td>
                  <td>{invoice.subtotal?.toFixed(2) || '0.00'} EGP</td>
                  <td>{invoice.total?.toFixed(2) || '0.00'} EGP</td>
                  <td>{invoice.totalRemaining?.toFixed(2) || '0.00'} EGP</td>
                  <td>
                    <span className={`status-badge status-${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/invoices/${invoice._id}`} className="btn-view">
                      View
                    </Link>
                    
                    {['admin', 'designer'].includes(user?.role) && (
                      <Link to={`/invoices/edit/${invoice._id}`} className="btn-edit">
                        Edit
                      </Link>
                    )}
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(invoice._id)}
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

      {/* Pagination */}
      {!loading && invoices.length > 0 && (
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

export default InvoiceList;

