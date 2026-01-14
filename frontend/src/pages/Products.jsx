import {
    faBoxOpen,
    faEdit,
    faPlus,
    faSave,
    faSearch,
    faTimes,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { materialService } from '../services/materialService';
import productService from '../services/productService';
// Reuse existing styles or create new ones? Let's check if we can reuse generic styles or scoped css.
// Using inline styles for simplicity given time constraints, or better, stick to design system tokens if possible.
import '../styles/designSystem.css';

const Products = () => {
    const { user } = useAuth(); // for permission checks if needed
    const { addNotification } = useNotification();

    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null); // null = create mode
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sellingPrice: '',
        materials: [], // [{ material: id, quantity: 1 }]
        category: 'General'
    });

    // Fetch data
    useEffect(() => {
        fetchProducts();
        fetchMaterials();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAll();
            setProducts(data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            addNotification('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const data = await materialService.getAll();
            setMaterials(data.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Modal Handlers
    const openModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                sellingPrice: product.sellingPrice,
                materials: product.materials.map(m => ({
                    material: m.material._id || m.material, // handle populated vs unpopulated
                    quantity: m.quantity
                })),
                category: product.category || 'General'
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                name: '',
                description: '',
                sellingPrice: '',
                materials: [],
                category: 'General'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    // Form Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...formData.materials];
        newMaterials[index][field] = value;
        setFormData(prev => ({ ...prev, materials: newMaterials }));
    };

    const addMaterialRow = () => {
        setFormData(prev => ({
            ...prev,
            materials: [...prev.materials, { material: '', quantity: 1 }]
        }));
    };

    const removeMaterialRow = (index) => {
        const newMaterials = formData.materials.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, materials: newMaterials }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate
            if (!formData.name || !formData.sellingPrice) {
                addNotification('Please fill in required fields', 'error');
                return;
            }

            // Clean up materials (remove empty ones)
            const validMaterials = formData.materials.filter(m => m.material && m.quantity > 0);

            const payload = {
                ...formData,
                materials: validMaterials,
                sellingPrice: Number(formData.sellingPrice)
            };

            if (currentProduct) {
                await productService.update(currentProduct._id, payload);
                addNotification('Product updated successfully', 'success');
            } else {
                await productService.create(payload);
                addNotification('Product created successfully', 'success');
            }

            closeModal();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            addNotification('Failed to save product', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.delete(id);
                addNotification('Product deleted successfully', 'success');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                addNotification('Failed to delete product', 'error');
            }
        }
    };

    // Render Helpers
    const getMaterialName = (id) => {
        const m = materials.find(mat => mat._id === id);
        return m ? m.name : 'Unknown';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-title">
                    <FontAwesomeIcon icon={faBoxOpen} className="header-icon" />
                    <h1>Products</h1>
                </div>
                <button className="btn-primary" onClick={() => openModal()}>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Product
                </button>
            </div>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Composition</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-desc">{product.description}</div>
                                        </td>
                                        <td>{product.category}</td>
                                        <td className="price-cell">{product.sellingPrice} EGP</td>
                                        <td>
                                            <div className="materials-list-mini">
                                                {product.materials && product.materials.length > 0 ? (
                                                    product.materials.map((m, idx) => (
                                                        <div key={idx} className="material-tag">
                                                            {m.material?.name || 'Unknown'} (x{m.quantity})
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-muted">No materials</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openModal(product)}
                                                title="Edit"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(product._id)}
                                                title="Delete"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-state">No products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content product-modal">
                        <div className="modal-header">
                            <h2>{currentProduct ? 'Edit Product' : 'New Product'}</h2>
                            <button className="btn-close" onClick={closeModal}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Product Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Selling Price (EGP) <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="2"
                                />
                            </div>

                            <div className="materials-section">
                                <div className="section-header">
                                    <label>Material Composition</label>
                                    <button type="button" className="btn-sm btn-secondary" onClick={addMaterialRow}>
                                        <FontAwesomeIcon icon={faPlus} /> Add Material
                                    </button>
                                </div>

                                {formData.materials.map((item, index) => (
                                    <div key={index} className="material-row">
                                        <select
                                            value={item.material}
                                            onChange={(e) => handleMaterialChange(index, 'material', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Material</option>
                                            {materials.map(m => (
                                                <option key={m._id} value={m._id}>
                                                    {m.name} ({m.currentStock} {m.unit})
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleMaterialChange(index, 'quantity', Number(e.target.value))}
                                            placeholder="Qty"
                                            min="0.1"
                                            step="0.1"
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="btn-icon delete"
                                            onClick={() => removeMaterialRow(index)}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    <FontAwesomeIcon icon={faSave} /> Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Basic Styles for Modal (if not covered by global CSS) */}
            <style>{`
        .product-modal { max-width: 600px; width: 90%; }
        .product-desc { font-size: 0.85rem; color: #666; margin-top: 4px; }
        .materials-list-mini { display: flex; flex-wrap: wrap; gap: 4px; }
        .material-tag { background: #f0f4f8; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: 1px solid #e1e4e8; }
        .materials-section { margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .material-row { display: grid; grid-template-columns: 2fr 1fr 40px; gap: 10px; margin-bottom: 8px; align-items: center; }
        .form-row { display: flex; gap: 15px; }
        .half { flex: 1; }
      `}</style>
        </div>
    );
};

export default Products;
