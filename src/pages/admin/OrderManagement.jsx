import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, increment, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSearch, FiEye, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
const STATUS_BADGE = {
    'Pending': 'warning', 'Confirmed': 'info', 'Packed': 'purple',
    'Out for Delivery': 'coral', 'Delivered': 'success', 'Cancelled': 'danger',
};

// Statuses that mean stock has been deducted
const STOCK_DEDUCTED_STATUSES = ['Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

const formatDate = (ts) => {
    if (!ts) return '—';
    try {
        if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (typeof ts === 'string') return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return '—';
    } catch { return '—'; }
};

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc')));
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const oldStatus = order.status || 'Pending';

        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: new Date().toISOString() });

            // Auto-reduce inventory when order moves to Confirmed (first time stock deduction)
            const wasDeducted = STOCK_DEDUCTED_STATUSES.includes(oldStatus);
            const shouldDeduct = STOCK_DEDUCTED_STATUSES.includes(newStatus);

            if (!wasDeducted && shouldDeduct && order.items?.length > 0) {
                // Deduct stock for each item
                for (const item of order.items) {
                    if (item.productId) {
                        try {
                            await updateDoc(doc(db, 'products', item.productId), {
                                stock: increment(-(item.quantity || 1)),
                                updatedAt: new Date().toISOString(),
                            });
                        } catch { /* product might not have stock field */ }
                    }
                }
                toast.success(`Order ${newStatus} — inventory updated!`);
            } else if (wasDeducted && !shouldDeduct && newStatus === 'Cancelled' && order.items?.length > 0) {
                // Restore stock on cancellation
                for (const item of order.items) {
                    if (item.productId) {
                        try {
                            await updateDoc(doc(db, 'products', item.productId), {
                                stock: increment(item.quantity || 1),
                                updatedAt: new Date().toISOString(),
                            });
                        } catch { /* ignore */ }
                    }
                }
                toast.success(`Order cancelled — stock restored!`);
            } else {
                toast.success(`Order status updated to ${newStatus}`);
            }

            // Log activity
            try {
                await addDoc(collection(db, 'activityLogs'), {
                    action: `Order #${orderId.slice(0, 8).toUpperCase()} status changed from ${oldStatus} to ${newStatus}`,
                    module: 'Orders',
                    user: 'Admin',
                    createdAt: new Date().toISOString(),
                });
            } catch { /* logging not critical */ }

            fetchOrders();
        } catch {
            toast.error('Failed to update status');
        }
    };

    // Calculate real total amount from items
    const calcTotal = (order) => {
        if (order.totalAmount) return order.totalAmount;
        return (order.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    };

    const totalRevenue = orders.reduce((sum, o) => sum + calcTotal(o), 0);
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

    const filtered = orders.filter(o => {
        const matchSearch = (o.customerName || o.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'All' || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <AdminLayout title="Order Management" subtitle="Track and manage customer orders">
            {/* Stats */}
            <div className="admin-stats-grid fade-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📦</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#4cc9f0' }}>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>✅</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#4ade80' }}>{deliveredCount}</h3>
                        <p>Delivered</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(244,162,97,0.12)', color: '#f4a261' }}>💰</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#f4a261' }}>₹{totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search orders..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 'auto', minWidth: '160px' }}
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No orders found</h3>
                    <p>Orders will appear here when customers place them</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#adb5bd' }}>
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.customerName || order.userEmail}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{order.items?.length || 0} items</td>
                                    <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{calcTotal(order).toLocaleString()}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{order.paymentMethod || 'COD'}</td>
                                    <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{formatDate(order.timestamp)}</td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={order.status || 'Pending'}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        >
                                            {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)} title="View Details">
                                            <FiEye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="detail-modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h2>Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Customer</span>
                                <span className="detail-value">{selectedOrder.customerName || selectedOrder.userEmail}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Total Amount</span>
                                <span className="detail-value" style={{ color: '#f4a261', fontWeight: 700 }}>₹{calcTotal(selectedOrder).toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Payment Method</span>
                                <span className="detail-value">{selectedOrder.paymentMethod || 'COD'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date</span>
                                <span className="detail-value">{formatDate(selectedOrder.timestamp)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">
                                    <span className={`badge badge-${STATUS_BADGE[selectedOrder.status] || 'warning'}`}>
                                        {selectedOrder.status || 'Pending'}
                                    </span>
                                </span>
                            </div>
                            {selectedOrder.address && (
                                <div className="detail-row">
                                    <span className="detail-label">Address</span>
                                    <span className="detail-value" style={{ maxWidth: '60%' }}>{selectedOrder.address}</span>
                                </div>
                            )}

                            <h3 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#212529', fontFamily: 'Inter, sans-serif' }}>
                                Items Ordered
                            </h3>
                            {selectedOrder.items?.length > 0 ? (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.name || item.productName || 'Item'}</td>
                                                    <td>{item.quantity || 1}</td>
                                                    <td style={{ fontWeight: 600 }}>₹{(item.price || 0).toLocaleString()}</td>
                                                    <td style={{ fontWeight: 600, color: '#f4a261' }}>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>No item details available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default OrderManagement;
