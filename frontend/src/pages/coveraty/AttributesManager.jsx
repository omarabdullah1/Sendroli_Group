import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext'; // Assuming context exists
import { createBrand, createModel, getBrands, getModels } from '../../services/storeService';

const AttributesManager = () => {
    const [activeTab, setActiveTab] = useState('brands');
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    // Forms
    const [brandName, setBrandName] = useState('');
    const [brandLogo, setBrandLogo] = useState(''); // Text URL for now, or file upload logic if needed

    const [modelName, setModelName] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    useEffect(() => {
        fetchBrands();
        fetchModels();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await getBrands();
            setBrands(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchModels = async () => {
        try {
            const res = await getModels();
            setModels(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddBrand = async (e) => {
        e.preventDefault();
        if (!brandName) return;
        try {
            setLoading(true);
            await createBrand({ name: brandName, logo: brandLogo });
            showNotification('Brand added successfully', 'success');
            setBrandName('');
            setBrandLogo('');
            fetchBrands();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Error adding brand', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddModel = async (e) => {
        e.preventDefault();
        if (!modelName || !selectedBrand) return;
        try {
            setLoading(true);
            await createModel({ name: modelName, brand: selectedBrand });
            showNotification('Model added successfully', 'success');
            setModelName('');
            fetchModels();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Error adding model', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Attributes Manager</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'brands' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('brands')}
                >
                    Brands
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'models' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('models')}
                >
                    Models
                </button>
            </div>

            {/* Brands Section */}
            {activeTab === 'brands' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Brand Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Add New Brand</h2>
                        <form onSubmit={handleAddBrand}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Samsung"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    value={brandLogo}
                                    onChange={(e) => setBrandLogo(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Brand'}
                            </button>
                        </form>
                    </div>

                    {/* Brands List */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Existing Brands ({brands.length})</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {brands.length === 0 ? (
                                <p className="text-gray-500">No brands found.</p>
                            ) : (
                                <ul className="divide-y">
                                    {brands.map((brand) => (
                                        <li key={brand._id} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {brand.logo ? (
                                                    <img src={brand.logo} alt={brand.name} className="w-8 h-8 object-contain" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">Img</div>
                                                )}
                                                <span className="font-medium text-gray-800">{brand.name}</span>
                                            </div>
                                            {/* <button className="text-red-500 hover:text-red-700">
                        <FontAwesomeIcon icon={faTrash} />
                      </button> */}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Models Section */}
            {activeTab === 'models' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Model Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Add New Model</h2>
                        <form onSubmit={handleAddModel}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand</label>
                                <select
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">-- Select Brand --</option>
                                    {brands.map((b) => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. S24 Ultra"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Model'}
                            </button>
                        </form>
                    </div>

                    {/* Models List */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Existing Models ({models.length})</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {models.length === 0 ? (
                                <p className="text-gray-500">No models found.</p>
                            ) : (
                                <ul className="divide-y">
                                    {models.map((model) => (
                                        <li key={model._id} className="py-3 flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-gray-800">{model.name}</span>
                                                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {model.brand?.name || 'Unknown Brand'}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesManager;
