import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import './Admin.css';

const REPORT_TYPES = ['Sales', 'Products', 'Attendance', 'Salary', 'Inventory'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('Sales');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderSnap, prodSnap, attSnap, salSnap] = await Promise.all([
                    getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'))),
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'attendance')),
                    getDocs(collection(db, 'salaryHistory')),
                ]);
                setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setAttendance(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setSalaryHistory(salSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalSalary = salaryHistory.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

    // Monthly sales for chart
    const monthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = new Array(12).fill(0);
        orders.forEach(o => {
            const ts = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(o.timestamp);
            if (!isNaN(ts)) data[ts.getMonth()] += (o.totalAmount || 0);
        });
        return months.map((label, i) => ({ label, value: data[i] }));
    };

    // Product sales ranking
    const productSales = () => {
        const map = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const name = item.name || item.productName || 'Unknown';
                map[name] = (map[name] || 0) + (item.quantity || 1);
            });
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, qty]) => ({ name, qty }));
    };

    const renderChart = (data) => {
        const max = Math.max(...data.map(d => d.value), 1);
        return (
            <div className="chart-container">
                <div className="chart-bars">
                    {data.map((d, i) => (
                        <div key={i} className="chart-bar-group">
                            <span className="chart-bar-value">₹{(d.value / 1000).toFixed(0)}k</span>
                            <div className="chart-bar" style={{
                                height: `${Math.max((d.value / max) * 100, 3)}%`,
                                background: i % 3 === 0 ? 'linear-gradient(180deg, #ff6b6b, #e85555)'
                                    : i % 3 === 1 ? 'linear-gradient(180deg, #4cc9f0, #2ba8d4)'
                                        : 'linear-gradient(180deg, #4ade80, #22c55e)',
                            }} />
                            <span className="chart-bar-label">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Reports & Analytics" subtitle="Business insights and analytics">
            {/* Tabs */}
            <div className="report-tabs fade-in">
                {REPORT_TYPES.map(t => (
                    <button key={t} className={`report-tab ${activeTab === t ? 'active' : ''}`}
                        onClick={() => setActiveTab(t)}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Sales Report */}
                    {activeTab === 'Sales' && (
                        <div className="fade-in">
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(244,162,97,0.12)', color: '#f4a261' }}>💰</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#f4a261' }}>₹{totalRevenue.toLocaleString()}</h3>
                                        <p>Total Revenue</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📦</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4cc9f0' }}>{orders.length}</h3>
                                        <p>Total Orders</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>📊</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4ade80' }}>₹{orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}</h3>
                                        <p>Avg Order Value</p>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-form-card">
                                <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Monthly Revenue</h2>
                                {renderChart(monthlyData())}
                            </div>
                        </div>
                    )}

                    {/* Products Report */}
                    {activeTab === 'Products' && (
                        <div className="fade-in">
                            <div className="admin-form-card">
                                <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Top Selling Products</h2>
                                {productSales().length === 0 ? (
                                    <p className="text-muted" style={{ textAlign: 'center', padding: '30px' }}>No sales data yet</p>
                                ) : (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr><th>#</th><th>Product</th><th>Units Sold</th></tr>
                                            </thead>
                                            <tbody>
                                                {productSales().map((p, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 700, color: '#adb5bd' }}>{i + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                        <td><span className="badge badge-info">{p.qty}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attendance Report */}
                    {activeTab === 'Attendance' && (
                        <div className="fade-in">
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>✅</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#16a34a' }}>{presentCount}</h3>
                                        <p>Total Present</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>❌</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#dc2626' }}>{attendance.length - presentCount}</h3>
                                        <p>Total Absent</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📅</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4cc9f0' }}>{attendance.length}</h3>
                                        <p>Total Records</p>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-form-card">
                                <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Recent Attendance Records</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {attendance.slice(0, 20).map((a) => (
                                                <tr key={a.id}>
                                                    <td style={{ fontWeight: 600 }}>{a.employeeName || '—'}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{a.date || '—'}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{a.checkIn || '—'}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{a.checkOut || '—'}</td>
                                                    <td>
                                                        <span className={`badge badge-${a.status === 'Present' ? 'success' : a.status === 'Late' ? 'warning' : 'danger'}`}>
                                                            {a.status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Salary Report */}
                    {activeTab === 'Salary' && (
                        <div className="fade-in">
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>💰</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4ade80' }}>₹{totalSalary.toLocaleString()}</h3>
                                        <p>Total Paid</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📋</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4cc9f0' }}>{salaryHistory.length}</h3>
                                        <p>Payment Records</p>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-form-card">
                                <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Recent Payments</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Employee</th><th>Month</th><th>Amount</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {salaryHistory.slice(0, 20).map((s) => (
                                                <tr key={s.id}>
                                                    <td style={{ fontWeight: 600 }}>{s.employeeName || '—'}</td>
                                                    <td>{s.salaryMonth || '—'}</td>
                                                    <td style={{ fontWeight: 700, color: '#4ade80' }}>₹{(s.amountPaid || 0).toLocaleString()}</td>
                                                    <td style={{ color: '#adb5bd', fontSize: '0.85rem' }}>{s.paymentDate || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventory Report */}
                    {activeTab === 'Inventory' && (
                        <div className="fade-in">
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📦</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#4cc9f0' }}>{products.length}</h3>
                                        <p>Total Products</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>⚠️</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#f59e0b' }}>{products.filter(p => (p.stock || p.quantity || 0) < 10 && (p.stock || p.quantity || 0) > 0).length}</h3>
                                        <p>Low Stock</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>🚫</div>
                                    <div className="stat-info">
                                        <h3 style={{ color: '#dc2626' }}>{products.filter(p => (p.stock || p.quantity || 0) === 0).length}</h3>
                                        <p>Out of Stock</p>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-form-card">
                                <h2 className="admin-section-title" style={{ marginBottom: '16px' }}>Stock Levels</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {products.map((p) => {
                                                const stock = p.stock || p.quantity || 0;
                                                return (
                                                    <tr key={p.id}>
                                                        <td style={{ fontWeight: 600 }}>{p.name || p.productName}</td>
                                                        <td><span className="badge badge-info">{p.category || '—'}</span></td>
                                                        <td style={{ fontWeight: 700, color: stock === 0 ? '#dc2626' : stock < 10 ? '#f59e0b' : '#16a34a' }}>{stock}</td>
                                                        <td>
                                                            <span className={`badge badge-${stock === 0 ? 'danger' : stock < 10 ? 'warning' : 'success'}`}>
                                                                {stock === 0 ? 'Out' : stock < 10 ? 'Low' : 'OK'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
};

export default Reports;
