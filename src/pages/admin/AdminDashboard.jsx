import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { FiPackage, FiUsers, FiShoppingBag, FiTrendingUp, FiUserPlus, FiShoppingCart, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import './Admin.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ products: 0, employees: 0, orders: 0, revenue: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0 });
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
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
                const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

                setStats({
                    products: prodSnap.size,
                    employees: empSnap.size,
                    orders: orderSnap.size,
                    revenue,
                });
                setRecentOrders(orders.slice(0, 5));

                // Low stock products (stock < 10)
                const lowStock = products.filter(p => (p.stock || p.quantity || 0) < 10);
                setLowStockProducts(lowStock.slice(0, 8));

                // Sales data for chart (group by day of week from recent orders)
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const daySales = [0, 0, 0, 0, 0, 0, 0];
                orders.forEach(o => {
                    const ts = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(o.timestamp);
                    if (!isNaN(ts)) {
                        daySales[ts.getDay()] += (o.totalAmount || 0);
                    }
                });
                setSalesData(dayNames.map((name, i) => ({ label: name, value: daySales[i] })));

                // Attendance summary for today
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const attSnap = await getDocs(collection(db, 'attendance'));
                    const todayRecords = attSnap.docs
                        .map(d => d.data())
                        .filter(r => r.date === today);
                    const presentCount = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
                    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
                    const totalEmps = empSnap.size;
                    setAttendanceSummary({
                        present: presentCount,
                        absent: totalEmps - presentCount,
                        late: lateCount,
                    });
                } catch { /* attendance might not exist */ }

            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchStats();
        return () => { mounted = false; };
    }, []);

    const STATUS_COLORS = {
        pending: 'warning',
        confirmed: 'info',
        shipped: 'info',
        completed: 'success',
        delivered: 'success',
        cancelled: 'danger',
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const STAT_CARDS = [
        { label: 'Total Products', value: stats.products, icon: <FiPackage />, color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
        { label: 'Employees', value: stats.employees, icon: <FiUsers />, color: '#059669', bg: 'rgba(5,150,105,0.12)' },
        { label: 'Total Orders', value: stats.orders, icon: <FiShoppingBag />, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
        { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <FiTrendingUp />, color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    ];

    const maxSale = Math.max(...salesData.map(d => d.value), 1);

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
                            <Link to="/admin/orders" className="btn btn-ghost btn-sm">View All →</Link>
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
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(108,117,125,0.7)' }}>
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ fontSize: '0.875rem' }}>{order.customerName || order.userEmail}</td>
                                                <td style={{ fontSize: '0.875rem' }}>{order.items?.length || 0} items</td>
                                                <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{order.totalAmount?.toLocaleString()}</td>
                                                <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{formatDate(order.timestamp)}</td>
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

                    {/* Sales Overview + Low Stock */}
                    <div className="dashboard-grid-2 fade-in">
                        {/* Sales Chart */}
                        <div className="admin-form-card">
                            <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Sales Overview</h2>
                            <div className="chart-container">
                                <div className="chart-bars">
                                    {salesData.map((d, i) => (
                                        <div key={i} className="chart-bar-group">
                                            <span className="chart-bar-value">₹{(d.value / 1000).toFixed(0)}k</span>
                                            <div
                                                className="chart-bar"
                                                style={{
                                                    height: `${Math.max((d.value / maxSale) * 100, 3)}%`,
                                                    background: i % 2 === 0
                                                        ? 'linear-gradient(180deg, #ff6b6b, #e85555)'
                                                        : 'linear-gradient(180deg, #4cc9f0, #2ba8d4)',
                                                }}
                                            />
                                            <span className="chart-bar-label">{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="admin-form-card">
                            <div className="admin-section-header">
                                <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiAlertTriangle size={16} color="#dc2626" /> Low Stock Alerts
                                </h2>
                            </div>
                            {lowStockProducts.length === 0 ? (
                                <p className="text-dim" style={{ textAlign: 'center', padding: '30px' }}>All products are well-stocked 🎉</p>
                            ) : (
                                <div className="low-stock-list">
                                    {lowStockProducts.map((p) => (
                                        <div key={p.id} className="low-stock-item">
                                            <span className="low-stock-name">{p.name || p.productName || 'Unknown'}</span>
                                            <span className="low-stock-count">{p.stock || p.quantity || 0} left</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Summary + Quick Actions */}
                    <div className="dashboard-grid-2 fade-in">
                        {/* Attendance Summary */}
                        <div className="admin-form-card">
                            <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Today's Attendance</h2>
                            <div className="attendance-summary-grid">
                                <div className="attendance-summary-card">
                                    <div className="att-number" style={{ color: '#16a34a' }}>{attendanceSummary.present}</div>
                                    <div className="att-label">Present</div>
                                </div>
                                <div className="attendance-summary-card">
                                    <div className="att-number" style={{ color: '#dc2626' }}>{attendanceSummary.absent}</div>
                                    <div className="att-label">Absent</div>
                                </div>
                                <div className="attendance-summary-card">
                                    <div className="att-number" style={{ color: '#f59e0b' }}>{attendanceSummary.late}</div>
                                    <div className="att-label">Late</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="admin-form-card">
                            <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Quick Actions</h2>
                            <div className="quick-actions">
                                <Link to="/admin/employees" className="quick-action-btn">
                                    <FiUserPlus size={16} /> Add Employee
                                </Link>
                                <Link to="/admin/orders" className="quick-action-btn">
                                    <FiShoppingCart size={16} /> View Orders
                                </Link>
                                <Link to="/admin/attendance" className="quick-action-btn">
                                    <FiCalendar size={16} /> Record Attendance
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
