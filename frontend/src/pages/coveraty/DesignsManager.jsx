import { faCloudUploadAlt, faImage, faPlus, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { createProduct, getBrands, getCategories, getModels, getProducts } from '../../services/storeService';

const DesignsManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    // Form State
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedModels, setSelectedModels] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, []);

    const fetchInitialData = async () => {
        try {
            const [catRes, brandRes, modelRes, prodRes] = await Promise.all([
                getCategories(),
                getBrands(),
                getModels(),
                getProducts()
            ]);
            setCategories(catRes.data);
            setBrands(brandRes.data);
            setModels(modelRes.data);
            setProducts(prodRes.data);
        } catch (err) {
            console.error(err);
            addNotification('Failed to load data', 'error');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleModelToggle = (modelId) => {
        setSelectedModels(prev =>
            prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
        );
    };

    const handleSelectAllModels = () => {
        if (selectedModels.length === models.length) {
            setSelectedModels([]);
        } else {
            setSelectedModels(models.map(m => m._id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !categoryId || !basePrice || !imageFile || selectedModels.length === 0) {
            addNotification('Please fill all fields and select at least one model', 'error');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', categoryId);
            formData.append('basePrice', basePrice);
            formData.append('image', imageFile);

            // Append each model ID individually
            selectedModels.forEach(id => formData.append('allowedModels[]', id));

            await createProduct(formData);
            addNotification('Design added successfully', 'success');

            // Reset form
            setTitle('');
            setCategoryId('');
            setBasePrice('');
            setImageFile(null);
            setImagePreview(null);
            setSelectedModels([]);

            // Reload products
            const res = await getProducts();
            setProducts(res.data);
        } catch (err) {
            console.error(err);
            addNotification(err.response?.data?.message || 'Error creating design', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Group models by brand for easier selection
    const modelsByBrand = brands.reduce((acc, brand) => {
        acc[brand._id] = models.filter(m => m.brand?._id === brand._id || m.brand === brand._id);
        return acc;
    }, {});

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Designs Manager</h1>
                    <p className="text-gray-500 mt-1">Upload and manage your custom phone case designs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Upload Form */}
                <div className="xl:col-span-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FontAwesomeIcon icon={faPlus} size="sm" />
                            </div>
                            New Design
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Design Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Abstract Waves"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                    <select
                                        value={categoryId}
                                        onChange={e => setCategoryId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Select...</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (EGP)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={basePrice}
                                            onChange={e => setBasePrice(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Design Image</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${imageFile ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                    <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/*" />
                                    <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Preview" className="h-48 w-full object-contain rounded-lg mx-auto" />
                                                <div className="mt-2 text-sm text-blue-600 font-medium">{imageFile.name}</div>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-900">Click to upload image</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Allowed Models</label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllModels}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    >
                                        {selectedModels.length === models.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded-lg h-64 overflow-y-auto bg-gray-50 p-3 custom-scrollbar">
                                    {brands.map(brand => (
                                        <div key={brand._id} className="mb-4 last:mb-0">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{brand.name}</h4>
                                            <div className="space-y-1">
                                                {modelsByBrand[brand._id]?.map(model => (
                                                    <label key={model._id} className="flex items-center p-2 rounded hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedModels.includes(model._id)}
                                                            onChange={() => handleModelToggle(model._id)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                                                        />
                                                        <span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900">{model.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-xs text-gray-500 text-right">
                                    {selectedModels.length} models selected
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 active:scale-[0.99] transition-all disabled:opacity-75"
                            >
                                {loading ? 'Creating Design...' : 'Create Design'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="xl:col-span-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Design Library</h2>
                            <div className="relative w-64">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search designs..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
                            {filteredProducts.map(product => (
                                <div key={product._id} className="group bg-white rounded-xl border border-gray-100 p-3 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                                    <div className="aspect-[4/5] bg-gray-50 rounded-lg mb-3 overflow-hidden relative">
                                        <img
                                            src={product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.image}`}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-8 h-8 rounded-full bg-white/90 text-red-500 hover:bg-red-50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                                                <FontAwesomeIcon icon={faTrash} size="sm" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate" title={product.title}>{product.title}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 truncate max-w-[50%]">{product.category?.name}</span>
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{product.basePrice} EGP</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredProducts.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-400">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                        <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-300" />
                                    </div>
                                    <p>No designs found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignsManager;
