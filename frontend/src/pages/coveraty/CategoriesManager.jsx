import { useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiFolder, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../services/storeService';

const CategoriesManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const { addNotification } = useNotification();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchCategories();
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            setCategories(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            addNotification('Failed to fetch categories', 'error');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
            setImagePreview(category.coverImage ? (category.coverImage.startsWith('http') ? category.coverImage : `${API_URL}${category.coverImage}`) : null);
        } else {
            setEditingCategory(null);
            setName('');
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (imageFile) {
                formData.append('coverImage', imageFile);
            }

            if (editingCategory) {
                await updateCategory(editingCategory._id, formData);
                addNotification('Category updated successfully', 'success');
            } else {
                await createCategory(formData);
                addNotification('Category created successfully', 'success');
            }

            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error(error);
            addNotification('Error saving category', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id);
                addNotification('Category deleted successfully', 'success');
                fetchCategories();
            } catch (error) {
                addNotification('Error deleting category', 'error');
            }
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories Manager</h1>
                    <p className="text-gray-500 mt-1">Manage product categories and their cover images.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 font-medium"
                >
                    <FiPlus size={20} /> Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <div key={category._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="h-40 bg-gray-50 relative overflow-hidden">
                            {category.coverImage ? (
                                <img
                                    src={category.coverImage.startsWith('http') ? category.coverImage : `${API_URL}${category.coverImage}`}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <FiImage size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                                <button
                                    onClick={() => openModal(category)}
                                    className="p-2 bg-white/90 text-blue-600 rounded-lg hover:bg-white shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
                                    title="Edit"
                                >
                                    <FiEdit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(category._id)}
                                    className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-white shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
                                    title="Delete"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <FiFolder size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-lg">{category.name}</h3>
                                <p className="text-xs text-gray-500">Active Category</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {categories.length === 0 && !loading && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="w-16 h-16 rounded-full bg-white text-gray-400 flex items-center justify-center mx-auto shadow-sm mb-4">
                            <FiFolder size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium text-lg">No Categories Yet</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">Create your first category to start organizing your products.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                        >
                            + Create Category
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-xl text-gray-800">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g. Phone Cases"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative group">
                                    <input type="file" onChange={handleFileChange} className="hidden" id="cat-image-upload" accept="image/*" />
                                    <label htmlFor="cat-image-upload" className="cursor-pointer block">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-lg" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <span className="bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-6">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                                                    <FiImage size={20} />
                                                </div>
                                                <span className="text-sm text-gray-600 font-medium">Click to upload cover</span>
                                                <p className="text-xs text-gray-400 mt-1">Optional. JPG/PNG.</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-medium shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                >
                                    <FiCheck /> {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesManager;
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState(null);
const [formData, setFormData] = useState({ name: '' });

const { addNotification } = useNotification();


useEffect(() => {
    console.log('CategoriesManager mounted');
    console.log('createCategory type:', typeof createCategory);
    console.log('addNotification type:', typeof addNotification);
    fetchCategories();
}, []);


const fetchCategories = async () => {
    try {
        const res = await getCategories();
        setCategories(res.data);
        setLoading(false);
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form...', { editingCategory, formData });
    try {
        if (editingCategory) {
            console.log('Updating category...');
            await updateCategory(editingCategory._id, formData);
            addNotification('Category updated successfully', 'success');
        } else {
            console.log('Creating category...', typeof createCategory);
            await createCategory(formData);
            console.log('Category created!');
            addNotification('Category created successfully', 'success');
        }
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '' });
        fetchCategories();
    } catch (error) {
        console.error('Error in handleSubmit:', error);
        if (typeof addNotification === 'function') {
            addNotification('Error saving category', 'error');
        } else {
            console.error('addNotification is not a function!');
        }
    }
};

const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
        try {
            await deleteCategory(id);
            addNotification('Category deleted successfully', 'success');
            fetchCategories();
        } catch (error) {
            addNotification('Error deleting category', 'error');
        }
    }
};

const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsModalOpen(true);
};

return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Categories Manager</h1>
            <button
                onClick={() => {
                    setEditingCategory(null);
                    setFormData({ name: '' });
                    setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
                <FiPlus /> Add Category
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
                <div key={category._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FiFolder size={20} />
                        </div>
                        <span className="font-semibold text-gray-700">{category.name}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openEditModal(category)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FiEdit2 size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <FiTrash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <FiX size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Phone Cases"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm shadow-blue-200"
                            >
                                <FiCheck /> {editingCategory ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
);
};

export default CategoriesManager;
