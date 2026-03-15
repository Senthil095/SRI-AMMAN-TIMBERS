import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSearch, FiEye, FiX, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Admin.css';

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custSnap, orderSnap] = await Promise.all([
                    getDocs(collection(db, 'customers')),
                    getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'))),
                ]);
                const custList = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const orderList = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setOrders(orderList);

                // If no dedicated customers collection, aggregate from orders
                if (custList.length > 0) {
                    // Enrich with order stats
                    const enriched = custList.map(c => {
                        const custOrders = orderList.filter(o =>
                            (o.customerEmail || o.userEmail) === c.email || o.customerName === c.name
                        );
                        return {
                            ...c,
                            totalOrders: custOrders.length,
                            totalSpent: custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                            orderHistory: custOrders,
                        };
                    });
                    setCustomers(enriched);
                } else {
                    // Build customers from orders
                    const map = {};
                    orderList.forEach(o => {
                        const key = o.customerEmail || o.userEmail || o.customerName || 'Unknown';
                        if (!map[key]) {
                            map[key] = {
                                id: key,
                                name: o.customerName || o.userName || key,
                                email: o.customerEmail || o.userEmail || '',
                                phone: o.customerPhone || o.phone || '',
                                address: o.address || o.shippingAddress || '',
                                totalOrders: 0,
                                totalSpent: 0,
                                orderHistory: [],
                                registrationDate: o.timestamp,
                            };
                        }
                        map[key].totalOrders++;
                        map[key].totalSpent += (o.totalAmount || 0);
                        map[key].orderHistory.push(o);
                    });
                    setCustomers(Object.values(map));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (ts) => {
        if (!ts) return '—';
        try {
            if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            if (typeof ts === 'string') return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return '—';
        } catch { return '—'; }
    };

    const filtered = customers.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
    );

    return (
        <AdminLayout title="Customer Management" subtitle="View and manage your customers">
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{customers.length} Customers</h2>
            </div>

            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search customers..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No customers found</h3>
                    <p>Customers will appear here when orders are placed</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Total Orders</th>
                                <th>Total Spent</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="emp-avatar">{(c.name || '?')[0].toUpperCase()}</div>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{c.email || '—'}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{c.phone || '—'}</td>
                                    <td><span className="badge badge-info">{c.totalOrders}</span></td>
                                    <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{c.totalSpent?.toLocaleString()}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(c)}>
                                            <FiEye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="detail-modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h2>Customer Profile</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f3f5' }}>
                                <div className="emp-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                                    {(selectedCustomer.name || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>{selectedCustomer.name}</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#adb5bd' }}>Customer since {formatDate(selectedCustomer.registrationDate)}</p>
                                </div>
                            </div>
                            {selectedCustomer.email && (
                                <div className="detail-row">
                                    <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiMail size={14} /> Email</span>
                                    <span className="detail-value">{selectedCustomer.email}</span>
                                </div>
                            )}
                            {selectedCustomer.phone && (
                                <div className="detail-row">
                                    <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiPhone size={14} /> Phone</span>
                                    <span className="detail-value">{selectedCustomer.phone}</span>
                                </div>
                            )}
                            {selectedCustomer.address && (
                                <div className="detail-row">
                                    <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiMapPin size={14} /> Address</span>
                                    <span className="detail-value" style={{ maxWidth: '60%' }}>{selectedCustomer.address}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="detail-label">Total Orders</span>
                                <span className="detail-value"><span className="badge badge-info">{selectedCustomer.totalOrders}</span></span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Total Spent</span>
                                <span className="detail-value" style={{ color: '#f4a261', fontWeight: 700 }}>₹{selectedCustomer.totalSpent?.toLocaleString()}</span>
                            </div>

                            {selectedCustomer.orderHistory?.length > 0 && (
                                <>
                                    <h3 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#212529', fontFamily: 'Inter, sans-serif' }}>
                                        Order History
                                    </h3>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedCustomer.orderHistory.slice(0, 10).map((o) => (
                                                    <tr key={o.id}>
                                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                                                        <td style={{ fontWeight: 600 }}>₹{o.totalAmount?.toLocaleString()}</td>
                                                        <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{formatDate(o.timestamp)}</td>
                                                        <td><span className={`badge badge-${o.status === 'Delivered' ? 'success' : 'warning'}`}>{o.status || 'Pending'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CustomerManagement;
