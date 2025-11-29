import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService } from '../services/inventoryService';
import { materialService } from '../services/materialService';
import Loading from '../components/Loading';
import './Inventory.css';

const Inventory = () => {
  const [materials, setMaterials] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showCountForm, setShowCountForm] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchMaterials(),
      fetchDailyCounts()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll({ limit: 100 });
      setMaterials(response.data.data.materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyCounts = async () => {
    try {
      const response = await inventoryService.getDailyCount(selectedDate);
      setDailyCounts(response.data.data);
    } catch (error) {
      console.error('Error fetching daily counts:', error);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleStartDailyCount = () => {
    setShowCountForm(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && materials.length === 0) {
    return (
      <div className="inventory-page">
        <Loading message="Loading inventory..." size="medium" />
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Daily Inventory</h1>
            <p>Track daily stock counts and manage inventory</p>
          </div>
          <div className="header-actions">
            <div className="date-selector">
              <label htmlFor="inventoryDate">Inventory Date:</label>
              <input
                type="date"
                id="inventoryDate"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {(user?.role === 'admin' || user?.role === 'worker') && (
              <button 
                className="btn btn-primary"
                onClick={handleStartDailyCount}
              >
                <i className="icon-clipboard"></i> Start Daily Count
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="inventory-summary">
          <div className="summary-card">
            <h3>Inventory Summary for {formatDate(selectedDate)}</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Materials:</span>
                <span className="stat-value">{materials.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Counted Today:</span>
                <span className="stat-value">{dailyCounts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending Count:</span>
                <span className="stat-value">{materials.length - dailyCounts.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="inventory-content">
          <div className="inventory-grid">
            {/* Current Stock Overview */}
            <div className="section">
              <h3>Current Stock Levels</h3>
              <div className="stock-overview">
                {materials.map(material => {
                  const hasCount = dailyCounts.some(count => count.material._id === material._id);
                  const getStockStatus = (material) => {
                    if (material.currentStock <= 0) return 'out-of-stock';
                    if (material.currentStock <= material.minStockLevel) return 'low-stock';
                    return 'good';
                  };

                  return (
                    <div key={material._id} className={`material-card ${getStockStatus(material)}`}>
                      <div className="material-info">
                        <h4>{material.name}</h4>
                        <p className="category">{material.category}</p>
                      </div>
                      <div className="stock-info">
                        <div className="current-stock">
                          <span className="label">Current:</span>
                          <span className="value">{material.currentStock} {material.unit}</span>
                        </div>
                        <div className="min-level">
                          <span className="label">Min Level:</span>
                          <span className="value">{material.minStockLevel} {material.unit}</span>
                        </div>
                      </div>
                      <div className="count-status">
                        {hasCount ? (
                          <span className="counted">✓ Counted</span>
                        ) : (
                          <span className="pending">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Counts */}
            {dailyCounts.length > 0 && (
              <div className="section">
                <h3>Today's Inventory Counts</h3>
                <div className="counts-table">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>System Stock</th>
                        <th>Actual Count</th>
                        <th>Difference</th>
                        {user?.role === 'admin' && <th>Wastage</th>}
                        <th>Counted By</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyCounts.map(count => {
                        const wastage = (count.systemStock || count.previousStock) - count.actualStock;
                        return (
                          <tr key={count._id}>
                            <td>{count.material.name}</td>
                            <td>{count.systemStock || count.previousStock}</td>
                            <td>{count.actualStock}</td>
                            <td className={count.difference !== 0 ? 'difference' : ''}>
                              {count.difference > 0 ? '+' : ''}{count.difference}
                            </td>
                            {user?.role === 'admin' && (
                              <td className={wastage > 0 ? 'wastage-positive' : wastage < 0 ? 'wastage-negative' : ''}>
                                {wastage > 0 ? `${wastage.toFixed(2)} (loss)` : wastage < 0 ? `${Math.abs(wastage).toFixed(2)} (gain)` : '0'}
                              </td>
                            )}
                            <td>{count.countedBy?.fullName}</td>
                            <td>{new Date(count.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Count Form Modal */}
      {showCountForm && (
        <DailyCountForm
          materials={materials}
          user={user}
          onSubmit={async (counts) => {
            try {
              await inventoryService.submitDailyCount({ counts });
              setShowCountForm(false);
              fetchDailyCounts();
              fetchMaterials();
            } catch (error) {
              console.error('Error submitting daily count:', error);
            }
          }}
          onClose={() => setShowCountForm(false)}
        />
      )}
    </div>
  );
};

// Simple Daily Count Form Component
const DailyCountForm = ({ materials, user, onSubmit, onClose }) => {
  const [counts, setCounts] = useState(
    materials.map(material => ({
      materialId: material._id,
      actualStock: material.currentStock,
      notes: ''
    }))
  );

  const handleCountChange = (index, value) => {
    const newCounts = [...counts];
    newCounts[index].actualStock = parseInt(value) || 0;
    setCounts(newCounts);
  };

  const handleNotesChange = (index, notes) => {
    const newCounts = [...counts];
    newCounts[index].notes = notes;
    setCounts(newCounts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(counts);
  };

  return (
    <div className="count-form-overlay">
      <div className="count-form-modal">
        <div className="form-header">
          <h2>Daily Inventory Count</h2>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="count-form">
          <div className="materials-list">
            {materials.map((material, index) => (
              <div key={material._id} className="count-item">
                <div className="material-info">
                  <h4>{material.name}</h4>
                  <p><strong>System Stock:</strong> {material.currentStock} {material.unit}</p>
                </div>
                <div className="count-inputs">
                  <div className="input-group">
                    <label>Actual Count (by Worker):</label>
                    <input
                      type="number"
                      value={counts[index].actualStock}
                      onChange={(e) => handleCountChange(index, e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                    <small>Count what you actually see in inventory</small>
                  </div>
                  <div className="input-group">
                    <label>Notes:</label>
                    <input
                      type="text"
                      value={counts[index].notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                {counts[index].actualStock !== material.currentStock && (
                  <div className="difference-indicator" style={{ 
                    padding: '10px', 
                    backgroundColor: counts[index].actualStock < material.currentStock ? '#fff3cd' : '#d4edda',
                    border: counts[index].actualStock < material.currentStock ? '1px solid #ffc107' : '1px solid #28a745',
                    borderRadius: '4px',
                    marginTop: '10px'
                  }}>
                    <div><strong>Difference:</strong> {counts[index].actualStock - material.currentStock} {material.unit}</div>
                    {user?.role === 'admin' && counts[index].actualStock < material.currentStock && (
                      <div style={{ color: '#856404' }}>
                        <strong>Wastage:</strong> {material.currentStock - counts[index].actualStock} {material.unit}
                      </div>
                    )}
                    {user?.role === 'admin' && counts[index].actualStock > material.currentStock && (
                      <div style={{ color: '#155724' }}>
                        <strong>Surplus:</strong> {counts[index].actualStock - material.currentStock} {material.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Count
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;