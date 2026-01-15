import { useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiFolder, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../services/storeService';

const CategoriesManager = () => {
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
