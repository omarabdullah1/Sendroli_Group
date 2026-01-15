import { useEffect, useState } from 'react';
import { FiMapPin, FiPhone, FiSearch } from 'react-icons/fi';
import { getStoreCustomers } from '../../services/storeService';

const StoreCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await getStoreCustomers();
            setCustomers(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Store Customers</h1>
                <div className="relative w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Customer</th>
                            <th className="p-4 font-semibold text-gray-600">Contact</th>
                            <th className="p-4 font-semibold text-gray-600">Location</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">Stats</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.phone} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            {customer.fullName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{customer.fullName}</p>
                                            <p className="text-xs text-gray-500">Last Order: {new Date(customer.lastOrderDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <FiPhone size={14} />
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.secondaryPhone && (
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <FiPhone size={14} />
                                                <span>{customer.secondaryPhone}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-start gap-2 text-gray-600 text-sm max-w-xs">
                                        <FiMapPin size={14} className="mt-1 flex-shrink-0" />
                                        <span>{customer.address}, {customer.city}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-4 bg-gray-50 px-3 py-1 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">Orders</p>
                                            <p className="font-bold text-gray-800">{customer.totalOrders}</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-200"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">Spent</p>
                                            <p className="font-bold text-green-600">{customer.totalSpent} EGP</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StoreCustomers;
