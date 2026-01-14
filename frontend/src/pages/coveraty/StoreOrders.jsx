import { faFilePdf, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { getStoreOrders, updateStoreOrderStatus } from '../../services/storeService';
import { formatDateTime } from '../../utils/dateUtils'; // Assuming dateUtils exists as seen in Orders.jsx

const StoreOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await getStoreOrders();
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            showNotification('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateStoreOrderStatus(orderId, newStatus);
            showNotification('Order status updated', 'success');
            fetchOrders();
        } catch (err) {
            showNotification('Failed to update status', 'error');
        }
    };

    const generateInvoice = (order) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(233, 30, 99); // Pinkish color for Coveraty branding
        doc.text('COVERATY STORE', 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Invoice #${order._id.slice(-6).toUpperCase()}`, 105, 30, null, null, 'center');
        doc.text(`Date: ${formatDateTime(order.createdAt)}`, 105, 36, null, null, 'center');

        // Customer Details
        doc.setFontSize(14);
        doc.text('Customer Details', 14, 50);
        doc.setFontSize(10);
        doc.text(`Name: ${order.customerName}`, 14, 58);
        doc.text(`Phone: ${order.phone} ${order.phoneSecondary ? ' / ' + order.phoneSecondary : ''}`, 14, 64);
        doc.text(`Address: ${order.address}, ${order.city}`, 14, 70);

        // Items Table
        const tableColumn = ["Product", "Model", "Qty", "Price", "Total"];
        const tableRows = [];

        order.items.forEach(item => {
            const productData = [
                item.productSnapshot?.title || 'Unknown Product',
                `${item.modelSnapshot?.brandName || ''} ${item.modelSnapshot?.name || ''}`,
                item.quantity,
                `${item.price} EGP`,
                `${item.price * item.quantity} EGP`
            ];
            tableRows.push(productData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] }
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`Total Amount: ${order.totalAmount} EGP`, 180, finalY, null, null, 'right');

        doc.save(`Invoice_${order.customerName}.pdf`);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Coveraty Orders</h1>

            {loading ? (
                <div className="text-center py-10 text-gray-500">
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Loading...
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#00CED1] text-white">
                            <tr>
                                <th className="p-4 font-semibold">Order ID</th>
                                <th className="p-4 font-semibold">Customer</th>
                                <th className="p-4 font-semibold">Items</th>
                                <th className="p-4 font-semibold">Total</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-6 text-center text-gray-500">No orders found.</td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm font-mono text-gray-600">#{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-700">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx}>
                                                        {item.quantity}x {item.productSnapshot?.title} ({item.modelSnapshot?.name})
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">{order.totalAmount} EGP</td>
                                        <td className="p-4 text-sm text-gray-500">{formatDateTime(order.createdAt)}</td>
                                        <td className="p-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className={`px-2 py-1 rounded-full text-xs font-semibold border-none cursor-pointer focus:ring-2 focus:ring-opacity-50
                          ${order.status === 'New' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'Printed' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' : ''}
                          ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}
                                            >
                                                <option value="New">New</option>
                                                <option value="Printed">Printed</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => generateInvoice(order)}
                                                className="text-gray-600 hover:text-red-500 transition-colors"
                                                title="Print Invoice"
                                            >
                                                <FontAwesomeIcon icon={faFilePdf} size="lg" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StoreOrders;
