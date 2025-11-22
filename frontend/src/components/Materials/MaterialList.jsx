import './MaterialList.css';

const MaterialList = ({ materials, onEdit, onDelete, userRole }) => {
  const getStockStatusClass = (material) => {
    if (material.currentStock <= 0) return 'status-out';
    if (material.currentStock <= material.minStockLevel) return 'status-low';
    return 'status-good';
  };

  const getStockStatusText = (material) => {
    if (material.currentStock <= 0) return 'Out of Stock';
    if (material.currentStock <= material.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  return (
    <div className="material-list">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Material Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Level</th>
              <th>Unit</th>
              <th>Cost/Unit</th>
              <th>Status</th>
              <th>Supplier</th>
              {userRole === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material._id}>
                <td className="material-name">{material.name}</td>
                <td>
                  <span className="category-badge category-{material.category}">
                    {material.category.charAt(0).toUpperCase() + material.category.slice(1)}
                  </span>
                </td>
                <td className="stock-amount">{material.currentStock}</td>
                <td className="min-level">{material.minStockLevel}</td>
                <td className="unit">{material.unit}</td>
                <td className="cost">{formatCurrency(material.costPerUnit)}</td>
                <td>
                  <span className={`stock-status ${getStockStatusClass(material)}`}>
                    {getStockStatusText(material)}
                  </span>
                </td>
                <td>{material.supplier?.name || 'No Supplier'}</td>
                {userRole === 'admin' && (
                  <td className="actions">
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => onEdit(material)}
                        title="Edit Material"
                      >
                        <i className="icon-edit"></i> Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(material._id)}
                        title="Delete Material"
                      >
                        <i className="icon-trash"></i> Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {materials.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No materials found</h3>
          <p>Start by adding your first material to the inventory.</p>
        </div>
      )}
    </div>
  );
};

export default MaterialList;