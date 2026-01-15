import { useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiTruck, FiX } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import { createShipping, deleteShipping, getShipping, updateShipping } from '../../services/storeService';

const ShippingManager = () => {
    const [shippingZones, setShippingZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({ city: '', cost: '' });

    const { addNotification } = useNotification();

    useEffect(() => {
        fetchShipping();
    }, []);

    const fetchShipping = async () => {
        try {
            const res = await getShipping();
            setShippingZones(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingZone) {
                await updateShipping(editingZone._id, formData);
                addNotification('Shipping zone updated successfully', 'success');
            } else {
                await createShipping(formData);
                addNotification('Shipping zone created successfully', 'success');
            }
            setIsModalOpen(false);
            setEditingZone(null);
            setFormData({ city: '', cost: '' });
            fetchShipping();
        } catch (error) {
            addNotification('Error saving shipping zone', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this shipping zone?')) {
            try {
                await deleteShipping(id);
                addNotification('Shipping zone deleted successfully', 'success');
                fetchShipping();
            } catch (error) {
                addNotification('Error deleting shipping zone', 'error');
            }
        }
    };

    const openEditModal = (zone) => {
        setEditingZone(zone);
        setFormData({ city: zone.city, cost: zone.cost });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Shipping Manager</h1>
                <button
                    onClick={() => {
                        setEditingZone(null);
                        setFormData({ city: '', cost: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <FiPlus /> Add Zone
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">City / Zone</th>
                            <th className="p-4 font-semibold text-gray-600">Shipping Cost (EGP)</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shippingZones.map((zone) => (
                            <tr key={zone._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                            <FiTruck size={18} />
                                        </div>
                                        <span className="font-medium text-gray-800">{zone.city}</span>
                                    </div>
                                </td>
                                <td className="p-4 font-semibold text-gray-700">{zone.cost} EGP</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(zone)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <FiEdit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(zone._id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {shippingZones.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    No shipping zones defined yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-800">
                                {editingZone ? 'Edit Shipping Zone' : 'Add New Zone'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Cairo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost (EGP)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0"
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
                                    <FiCheck /> {editingZone ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingManager;
