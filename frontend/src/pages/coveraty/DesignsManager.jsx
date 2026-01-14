import { faUpload } from '@fortawesome/free-solid-svg-icons';
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
    const { showNotification } = useNotification();

    // Form State
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [selectedModels, setSelectedModels] = useState([]);

    useEffect(() => {
        fetchInitialData();
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
            showNotification('Failed to load data', 'error');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
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
            showNotification('Please fill all fields and select at least one model', 'error');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', categoryId);
            formData.append('basePrice', basePrice);
            formData.append('image', imageFile);
            // Append selected models properly (as multiple fields or stringified JSON if backend expects)
            // Standard way is repeating the key or JSON. Backend schema is array of OID.
            // Mongoose handles array of strings ok if sent as array.
            // FormData: need to append individually or handled by backend parser.
            // Express bodyParser array support: key[] or duplicate key.
            selectedModels.forEach(id => formData.append('allowedModels[]', id)); // Using [] convention often safer
            // Wait, Mongoose + Standard Express might expect 'allowedModels' repeated.
            // Let's try iterating.

            // Actually, if I just append 'allowedModels' multiple times, multer handles file, but body fields...
            // req.body.allowedModels will be an array if multiple, string if single.
            // I'll append individually.
            // Update: Frontend FormData usually repeats key.

            // NOTE: backend controller `req.body` has `{ ...req.body }`. 
            // I'll assume backend handles `allowedModels` from body correctly.

            //   selectedModels.forEach(id => formData.append('allowedModels', id));

            // Alternative: Send as JSON string and parse in backend? No, standard is array.
            // Let's rely on standard parsing.
            selectedModels.forEach(id => formData.append('allowedModels', id));

            await createProduct(formData);
            showNotification('Design added successfully', 'success');

            // Reset form
            setTitle('');
            setCategoryId('');
            setBasePrice('');
            setImageFile(null);
            setSelectedModels([]);
            // Reload products
            const res = await getProducts();
            setProducts(res.data);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Error creating design', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Group models by brand for easier selection
    const modelsByBrand = brands.reduce((acc, brand) => {
        acc[brand._id] = models.filter(m => m.brand?._id === brand._id || m.brand === brand._id);
        return acc;
    }, {});

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Designs Manager</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border h-fit">
                    <h2 className="text-lg font-semibold mb-4">Upload New Design</h2>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Design Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded" required />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border rounded" required>
                                <option value="">-- Select Category --</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (EGP)</label>
                            <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full p-2 border rounded" required />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Design Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                                <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/*" />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {imageFile ? <span className="text-green-600 truncate block">{imageFile.name}</span> : (
                                        <div className="text-gray-500">
                                            <FontAwesomeIcon icon={faUpload} className="mb-2 text-2xl" />
                                            <p className="text-xs">Click to upload</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Models</label>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">{selectedModels.length} selected</span>
                                <button type="button" onClick={handleSelectAllModels} className="text-xs text-blue-600 hover:underline">
                                    {selectedModels.length === models.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="border rounded max-h-60 overflow-y-auto p-2 bg-gray-50">
                                {brands.map(brand => (
                                    <div key={brand._id} className="mb-3">
                                        <h4 className="font-semibold text-xs text-gray-600 uppercase mb-1">{brand.name}</h4>
                                        <div className="space-y-1 ml-2">
                                            {modelsByBrand[brand._id]?.map(model => (
                                                <label key={model._id} className="flex items-center text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModels.includes(model._id)}
                                                        onChange={() => handleModelToggle(model._id)}
                                                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {model.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                            {loading ? 'Uploading...' : 'Create Design'}
                        </button>
                    </form>
                </div>

                {/* Designs Grid */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Existing Designs ({products.length})</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map(product => (
                            <div key={product._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                                <div className="aspect-square bg-gray-100 relative">
                                    {/* Server returns /uploads/..., we need to prepend API URL if it's relative? 
                                 Wait, server serves /uploads. 
                                 However, Vite runs on 5173, Backend on 5000.
                                 If image path is /uploads/foo.jpg, browser asks localhost:5173/uploads/foo.jpg -> 404.
                                 We need backend URL.
                             */}
                                    <img
                                        src={product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.image}`}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-gray-900 truncate" title={product.title}>{product.title}</h3>
                                    <p className="text-sm text-gray-500">{product.category?.name}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-gray-800">{product.basePrice} EGP</span>
                                        {/* <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.allowedModels?.length} Models</span> */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignsManager;
