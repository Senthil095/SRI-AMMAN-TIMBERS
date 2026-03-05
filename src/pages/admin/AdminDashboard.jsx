import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPackage, FiUsers, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import './Admin.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ products: 0, employees: 0, orders: 0, revenue: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
                // Safety timeout
                const timeoutId = setTimeout(() => {
                    if (mounted && loading) {
                        console.warn('Dashboard fetch timed out');
                        setLoading(false);
                    }
                }, 5000);

                const [prodSnap, empSnap, orderSnap] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'employees')),
                    getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'))),
                ]);

                clearTimeout(timeoutId);

                if (!mounted) return;

                const orders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                setStats({
                    products: prodSnap.size,
                    employees: empSnap.size,
                    orders: orderSnap.size,
                    revenue,
                });
                setRecentOrders(orders.slice(0, 5));
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                // Keep default stats on error
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchStats();
        return () => { mounted = false; };
    }, []);

    const STATUS_COLORS = {
        pending: 'warning',
        shipped: 'info',
        completed: 'success',
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const STAT_CARDS = [
        { label: 'Total Products', value: stats.products, icon: <FiPackage />, color: '#4cc9f0', bg: 'rgba(76,201,240,0.12)' },
        { label: 'Employees', value: stats.employees, icon: <FiUsers />, color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
        { label: 'Total Orders', value: stats.orders, icon: <FiShoppingBag />, color: '#e63946', bg: 'rgba(230,57,70,0.12)' },
        { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <FiTrendingUp />, color: '#f4a261', bg: 'rgba(244,162,97,0.12)' },
    ];

    return (
        <AdminLayout title="Dashboard" subtitle="Welcome back, Admin">
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="admin-stats-grid fade-in">
                        {STAT_CARDS.map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                                    {s.icon}
                                </div>
                                <div className="stat-info">
                                    <h3 style={{ color: s.color }}>{s.value}</h3>
                                    <p>{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Orders */}
                    <div className="admin-form-card fade-in">
                        <div className="admin-section-header">
                            <h2 className="admin-section-title">Recent Orders</h2>
                        </div>
                        {recentOrders.length === 0 ? (
                            <p className="text-dim" style={{ textAlign: 'center', padding: '40px' }}>No orders yet</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(248,249,250,0.5)' }}>
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ fontSize: '0.875rem' }}>{order.userEmail}</td>
                                                <td style={{ fontSize: '0.875rem' }}>{order.items?.length || 0} items</td>
                                                <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{order.totalAmount?.toLocaleString()}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'rgba(248,249,250,0.5)' }}>{formatDate(order.timestamp)}</td>
                                                <td>
                                                    <span className={`badge badge-${STATUS_COLORS[order.status] || 'warning'}`}>
                                                        {order.status || 'pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
