import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiEye, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
const STATUS_BADGE = {
    'Pending': 'warning', 'Confirmed': 'info', 'Packed': 'purple',
    'Out for Delivery': 'coral', 'Delivered': 'success', 'Cancelled': 'danger',
};

const formatDate = (ts) => {
    if (!ts) return '—';
    try {
        if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (typeof ts === 'string') return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return '—';
    } catch { return '—'; }
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/orders`);
            const data = await res.json();
            if (res.ok && data.orders) {
                setOrders(data.orders);
            } else {
                console.error('Failed to fetch orders:', data.error);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
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
            const res = await fetch(`${BACKEND_URL}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                toast.error(data.error || 'Failed to update status');
            }

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
                                <th>Payment Status</th>
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
                                    <td style={{ fontSize: '0.8rem' }}>
                                        <span className={`badge badge-${order.paymentStatus === 'Paid' ? 'success' : order.paymentStatus === 'Failed' ? 'danger' : 'warning'}`}>
                                            {order.paymentStatus || order.paymentMethod || 'Pending'}
                                        </span>
                                    </td>
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
                                <span className="detail-label">Payment Status</span>
                                <span className="detail-value">
                                    <span className={`badge badge-${selectedOrder.paymentStatus === 'Paid' ? 'success' : selectedOrder.paymentStatus === 'Failed' ? 'danger' : 'warning'}`}>
                                        {selectedOrder.paymentStatus || selectedOrder.paymentMethod || 'Pending'}
                                    </span>
                                </span>
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
                            {selectedOrder.deliveryAddress && (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Delivery Name</span>
                                        <span className="detail-value">{selectedOrder.deliveryAddress.name || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Phone</span>
                                        <span className="detail-value">{selectedOrder.deliveryAddress.phone || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Delivery Address</span>
                                        <span className="detail-value" style={{ maxWidth: '60%' }}>
                                            {selectedOrder.deliveryAddress.address}, {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                                        </span>
                                    </div>
                                </>
                            )}
                            {selectedOrder.razorpayPaymentId && (
                                <div className="detail-row">
                                    <span className="detail-label">Razorpay Payment ID</span>
                                    <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{selectedOrder.razorpayPaymentId}</span>
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
