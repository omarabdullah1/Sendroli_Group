import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService } from '../services/inventoryService';
import { materialService } from '../services/materialService';
import Loading from '../components/Loading';
import './MaterialWithdrawal.css';

const MaterialWithdrawal = () => {
  const [materials, setMaterials] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [notes, setNotes] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchMaterials();
    fetchWithdrawals();
  }, [filterDate]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll({ limit: 100 });
      // Filter only materials with stock > 0
      const availableMaterials = response.data.data.materials.filter(m => m.currentStock > 0);
      setMaterials(availableMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMessage({ type: 'error', text: 'Failed to load materials' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await inventoryService.getWithdrawals({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: 1,
        limit: 50
      });
      setWithdrawals(response.data.data.withdrawals || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedMaterial) {
      setMessage({ type: 'error', text: 'Please select a material' });
      return;
    }

    const material = materials.find(m => m._id === selectedMaterial);
    if (!material || material.currentStock <= 0) {
      setMessage({ type: 'error', text: 'Selected material is out of stock' });
      return;
    }

    try {
      setWithdrawing(true);
      setMessage({ type: '', text: '' });
      
      await inventoryService.withdrawMaterial({
        materialId: selectedMaterial,
        notes: notes || `Withdrawn by ${user.fullName}`
      });

      setMessage({ type: 'success', text: `Successfully withdrew 1 piece of ${material.name}` });
      setNotes('');
      
      // Refresh materials and withdrawals
      await fetchMaterials();
      await fetchWithdrawals();
      
      // Clear selection if material is now out of stock
      const updatedMaterial = materials.find(m => m._id === selectedMaterial);
      if (!updatedMaterial || updatedMaterial.currentStock <= 0) {
        setSelectedMaterial('');
      }
    } catch (error) {
      console.error('Error withdrawing material:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to withdraw material' 
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const selectedMaterialData = materials.find(m => m._id === selectedMaterial);

  if (loading && materials.length === 0) {
    return (
      <div className="material-withdrawal-page">
        <Loading message="Loading materials..." size="medium" />
      </div>
    );
  }

  return (
    <div className="material-withdrawal-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Material Withdrawal</h1>
            <p>Record material withdrawals from inventory (one piece at a time)</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="withdrawal-section">
          <div className="withdrawal-form-card">
            <h2>Withdraw Material</h2>
            <div className="form-group">
              <label htmlFor="material">Select Material *</label>
              <select
                id="material"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                disabled={withdrawing}
              >
                <option value="">Select a material</option>
                {materials.map(material => (
                  <option key={material._id} value={material._id}>
                    {material.name} - Stock: {material.currentStock} piece
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterialData && (
              <div className="material-info">
                <div className="info-item">
                  <span className="label">Current Stock:</span>
                  <span className="value">{selectedMaterialData.currentStock} piece</span>
                </div>
                <div className="info-item">
                  <span className="label">Category:</span>
                  <span className="value">{selectedMaterialData.category}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this withdrawal..."
                rows="3"
                disabled={withdrawing}
              />
            </div>

            <div className="withdrawal-info">
              <p className="info-text">
                <strong>Note:</strong> Each withdrawal is for <strong>1 piece</strong>. 
                To withdraw multiple pieces, click the withdraw button multiple times.
              </p>
            </div>

            <button
              className="btn btn-primary withdraw-btn"
              onClick={handleWithdraw}
              disabled={!selectedMaterial || withdrawing || (selectedMaterialData && selectedMaterialData.currentStock <= 0)}
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw 1 Piece'}
            </button>
          </div>
        </div>

        <div className="withdrawals-history-section">
          <div className="section-header">
            <h2>Today's Withdrawals</h2>
            <div className="date-filter">
              <label htmlFor="filterDate">Date:</label>
              <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {withdrawals.length > 0 ? (
            <div className="table-wrapper">
              <div className="withdrawals-table">
                <table className="data-table">
                  <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Withdrawn By</th>
                    <th>Notes</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(withdrawal => {
                    const quantity = withdrawal.previousStock - withdrawal.actualStock;
                    return (
                      <tr key={withdrawal._id}>
                        <td>{withdrawal.material?.name || 'N/A'}</td>
                        <td>{withdrawal.material?.category || 'N/A'}</td>
                        <td>{quantity} piece</td>
                        <td>{withdrawal.countedBy?.fullName || 'N/A'}</td>
                        <td>{withdrawal.notes || '-'}</td>
                        <td>{new Date(withdrawal.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>No withdrawals recorded for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialWithdrawal;

