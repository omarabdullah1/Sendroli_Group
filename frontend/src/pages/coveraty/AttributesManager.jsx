import { useEffect, useState } from 'react';
import { FiBox, FiEdit2, FiPlus, FiSmartphone, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import { createBrand, createModel, deleteBrand, deleteModel, getBrands, getModels, updateBrand, updateModel } from '../../services/storeService';

const AttributesManager = () => {
    // State
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [activeTab, setActiveTab] = useState('brands');

    // Modals
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingModel, setEditingModel] = useState(null);

    // Forms
    const [brandForm, setBrandForm] = useState({ name: '', logo: null });
    const [modelForm, setModelForm] = useState({ name: '', brand: '' });

    const { addNotification } = useNotification();

    useEffect(() => {
        fetchBrands();
        fetchModels();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await getBrands();
            setBrands(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchModels = async () => {
        try {
            const res = await getModels();
            setModels(res.data);
        } catch (error) { console.error(error); }
    };

    // --- BRAND HANDLERS ---
    const handleBrandSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', brandForm.name);
        if (brandForm.logo) data.append('logo', brandForm.logo);

        try {
            if (editingBrand) {
                await updateBrand(editingBrand._id, data);
                addNotification('Brand updated successfully', 'success');
            } else {
                await createBrand(data);
                addNotification('Brand created successfully', 'success');
            }
            setIsBrandModalOpen(false);
            setEditingBrand(null);
            setBrandForm({ name: '', logo: null });
            fetchBrands();
        } catch (error) {
            addNotification('Error saving brand', 'error');
        }
    };

    const handleBrandDelete = async (id) => {
        if (window.confirm('Delete this brand?')) {
            try {
                await deleteBrand(id);
                fetchBrands();
                addNotification('Brand deleted', 'success');
            } catch (error) {
                addNotification('Error deleting brand', 'error');
            }
        }
    };

    // --- MODEL HANDLERS ---
    const handleModelSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingModel) {
                await updateModel(editingModel._id, modelForm);
                addNotification('Model updated successfully', 'success');
            } else {
                await createModel(modelForm);
                addNotification('Model created successfully', 'success');
            }
            setIsModelModalOpen(false);
            setEditingModel(null);
            setModelForm({ name: '', brand: '' });
            fetchModels();
        } catch (error) {
            addNotification('Error saving model', 'error');
        }
    };

    const handleModelDelete = async (id) => {
        if (window.confirm('Delete this model?')) {
            try {
                await deleteModel(id);
                fetchModels();
                addNotification('Model deleted', 'success');
            } catch (error) {
                addNotification('Error deleting model', 'error');
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Attributes Manager</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`pb-3 px-6 font-medium transition-all relative ${activeTab === 'brands' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <FiBox /> Brands
                    </div>
                    {activeTab === 'brands' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('models')}
                    className={`pb-3 px-6 font-medium transition-all relative ${activeTab === 'models' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <FiSmartphone /> Models
                    </div>
                    {activeTab === 'models' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {/* BRANDS TAB */}
            {activeTab === 'brands' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => {
                                setEditingBrand(null);
                                setBrandForm({ name: '', logo: null });
                                setIsBrandModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiPlus /> Add Brand
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brands.map((brand) => (
                            <div key={brand._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <FiBox className="text-gray-300" />
                                        )}
                                    </div>
                                    <span className="font-semibold text-gray-700">{brand.name}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingBrand(brand);
                                            setBrandForm({ name: brand.name, logo: null });
                                            setIsBrandModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleBrandDelete(brand._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODELS TAB */}
            {activeTab === 'models' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => {
                                setEditingModel(null);
                                setModelForm({ name: '', brand: '' });
                                setIsModelModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiPlus /> Add Model
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.map((model) => (
                            <div key={model._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-700">{model.name}</h4>
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                                        {model.brand?.name || 'Unknown Brand'}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingModel(model);
                                            setModelForm({ name: model.name, brand: model.brand?._id || '' });
                                            setIsModelModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleModelDelete(model._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BRAND MODAL */}
            {isBrandModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h3>
                            <button onClick={() => setIsBrandModalOpen(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleBrandSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    required
                                    value={brandForm.name}
                                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setBrandForm({ ...brandForm, logo: e.target.files[0] })}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <FiUpload size={24} />
                                        <span className="text-xs">{brandForm.logo ? brandForm.logo.name : 'Click to upload logo'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODEL MODAL */}
            {isModelModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">{editingModel ? 'Edit Model' : 'Add Model'}</h3>
                            <button onClick={() => setIsModelModalOpen(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleModelSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                <input
                                    type="text"
                                    required
                                    value={modelForm.name}
                                    onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <select
                                    required
                                    value={modelForm.brand}
                                    onChange={(e) => setModelForm({ ...modelForm, brand: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Brand</option>
                                    {brands.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModelModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesManager;
