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
import '../styles/designSystem.css';

const Products = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();

    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sellingPrice: '',
        materials: [],
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
            const response = await productService.getAll();
            // Backend returns { success: true, count: X, data: [...products] }
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            addNotification('Failed to load products', 'error');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await materialService.getAll();
            // Handle nested data structure from materials API
            const materialsData = response.data?.data?.materials || response.data?.materials || response.data || [];
            setMaterials(Array.isArray(materialsData) ? materialsData : []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            setMaterials([]);
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
                <div className="header-content">
                    <div className="header-title">
                        <FontAwesomeIcon icon={faBoxOpen} style={{ marginRight: '12px', color: 'var(--theme-primary)' }} />
                        <div>
                            <h1>Products Management</h1>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Manage your products and their material compositions
                            </p>
                        </div>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'designer') && (
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            <div className="search-bar" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="search-input-wrapper" style={{ position: 'relative', maxWidth: '500px' }}>
                    <FontAwesomeIcon
                        icon={faSearch}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            transition: 'all var(--transition-fast)'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 'var(--space-16)',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--text-secondary)'
                }}>
                    Loading products...
                </div>
            ) : (
                <div className="table-wrapper">
                    <div className="scroll-indicator">
                        ← Scroll horizontally to view all columns →
                    </div>
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
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {product.name}
                                                </div>
                                                {product.description && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                        {product.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{product.category}</td>
                                            <td style={{ fontWeight: '600', color: 'var(--theme-primary)' }}>
                                                {product.sellingPrice} EGP
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {product.materials && product.materials.length > 0 ? (
                                                        product.materials.map((m, idx) => (
                                                            <span
                                                                key={idx}
                                                                style={{
                                                                    background: 'var(--theme-bg-light)',
                                                                    padding: '4px 8px',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    fontSize: '0.75rem',
                                                                    border: '1px solid var(--border-light)',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {m.material?.name || 'Unknown'} (x{m.quantity})
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                            No materials
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {(user?.role === 'admin' || user?.role === 'designer') && (
                                                        <button
                                                            className="btn-icon edit"
                                                            onClick={() => openModal(product)}
                                                            title="Edit"
                                                            style={{
                                                                padding: '8px 12px',
                                                                background: 'var(--theme-primary-lighter)',
                                                                color: 'var(--theme-primary-dark)',
                                                                border: 'none',
                                                                borderRadius: 'var(--radius-md)',
                                                                cursor: 'pointer',
                                                                transition: 'all var(--transition-fast)'
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                    )}
                                                    {user?.role === 'admin' && (
                                                        <button
                                                            className="btn-icon delete"
                                                            onClick={() => handleDelete(product._id)}
                                                            title="Delete"
                                                            style={{
                                                                padding: '8px 12px',
                                                                background: '#fee2e2',
                                                                color: 'var(--error)',
                                                                border: 'none',
                                                                borderRadius: 'var(--radius-md)',
                                                                cursor: 'pointer',
                                                                transition: 'all var(--transition-fast)'
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-secondary)' }}>
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content product-modal">
                        <div className="modal-header">
                            <h2>{currentProduct ? 'Edit Product' : 'New Product'}</h2>
                            <button
                                className="btn-secondary"
                                onClick={closeModal}
                                style={{
                                    padding: '8px 12px',
                                    minWidth: 'auto'
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)' }}>
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontWeight: '500',
                                    fontSize: 'var(--text-sm)'
                                }}>
                                    Product Name <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-2)',
                                        fontWeight: '500',
                                        fontSize: 'var(--text-sm)'
                                    }}>
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: 'var(--space-3)',
                                            border: '1px solid var(--border-medium)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--text-base)'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-2)',
                                        fontWeight: '500',
                                        fontSize: 'var(--text-sm)'
                                    }}>
                                        Selling Price (EGP) <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: 'var(--space-3)',
                                            border: '1px solid var(--border-medium)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--text-base)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontWeight: '500',
                                    fontSize: 'var(--text-sm)'
                                }}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="2"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{
                                marginTop: 'var(--space-6)',
                                paddingTop: 'var(--space-4)',
                                borderTop: '1px solid var(--border-light)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 'var(--space-4)'
                                }}>
                                    <label style={{ fontWeight: '500', fontSize: 'var(--text-base)' }}>
                                        Material Composition
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={addMaterialRow}
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    >
                                        <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
                                        Add Material
                                    </button>
                                </div>

                                {formData.materials.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '2fr 1fr 40px',
                                            gap: '10px',
                                            marginBottom: '8px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <select
                                            value={item.material}
                                            onChange={(e) => handleMaterialChange(index, 'material', e.target.value)}
                                            required
                                            style={{
                                                padding: 'var(--space-3)',
                                                border: '1px solid var(--border-medium)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: 'var(--text-base)'
                                            }}
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
                                            style={{
                                                padding: 'var(--space-3)',
                                                border: '1px solid var(--border-medium)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: 'var(--text-base)'
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeMaterialRow(index)}
                                            style={{
                                                padding: '8px',
                                                background: '#fee2e2',
                                                color: 'var(--error)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer" style={{ marginTop: 'var(--space-6)' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px' }} />
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
