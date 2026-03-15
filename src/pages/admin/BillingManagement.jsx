import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSearch, FiEye, FiPrinter, FiX } from 'react-icons/fi';
import './Admin.css';

const BillingManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
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
        fetchOrders();
    }, []);

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handlePrint = () => {
        window.print();
    };

    const filtered = orders.filter(o =>
        (o.customerName || o.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())
    );

    const TAX_RATE = 0.18; // 18% GST

    return (
        <AdminLayout title="Billing & Invoices" subtitle="Generate and manage invoices">
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{orders.length} Invoices</h2>
            </div>

            <div className="filter-bar fade-in no-print">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search invoices..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Invoice View */}
            {selectedOrder ? (
                <div className="fade-in">
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }} className="no-print">
                        <button className="btn btn-ghost" onClick={() => setSelectedOrder(null)}>
                            <FiX size={16} /> Back to List
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            <FiPrinter size={16} /> Print Invoice
                        </button>
                    </div>

                    <div className="invoice-container" id="invoice-print">
                        <div className="invoice-header">
                            <div className="invoice-logo">
                                <h2>PaintPro</h2>
                                <p>Paint Shop & Retail</p>
                            </div>
                            <div className="invoice-info">
                                <strong>Invoice #{selectedOrder.id.slice(0, 8).toUpperCase()}</strong><br />
                                Date: {formatDate(selectedOrder.timestamp)}<br />
                                Status: {selectedOrder.status || 'Pending'}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                                Bill To
                            </h4>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#212529', fontFamily: 'Inter, sans-serif' }}>
                                {selectedOrder.customerName || selectedOrder.userEmail}
                            </p>
                            {selectedOrder.address && <p style={{ fontSize: '0.82rem', color: '#6c757d', fontFamily: 'Inter, sans-serif' }}>{selectedOrder.address}</p>}
                            {selectedOrder.customerPhone && <p style={{ fontSize: '0.82rem', color: '#6c757d', fontFamily: 'Inter, sans-serif' }}>{selectedOrder.customerPhone}</p>}
                        </div>

                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedOrder.items || []).map((item, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{item.name || item.productName || 'Item'}</td>
                                        <td>{item.quantity || 1}</td>
                                        <td>₹{(item.price || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <div style={{ width: '260px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', color: '#495057' }}>
                                    <span>Subtotal</span>
                                    <span>₹{(selectedOrder.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', color: '#495057', borderBottom: '1px solid #f1f3f5' }}>
                                    <span>Tax (18% GST)</span>
                                    <span>₹{Math.round((selectedOrder.totalAmount || 0) * TAX_RATE).toLocaleString()}</span>
                                </div>
                                <div className="invoice-total" style={{ paddingTop: '12px' }}>
                                    Grand Total: ₹{Math.round((selectedOrder.totalAmount || 0) * (1 + TAX_RATE)).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #f1f3f5', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: '#adb5bd', fontFamily: 'Inter, sans-serif' }}>
                                Payment Method: {selectedOrder.paymentMethod || 'Cash on Delivery'} &nbsp;•&nbsp; Thank you for your business!
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="loading-center"><div className="spinner" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🧾</div>
                            <h3>No invoices found</h3>
                            <p>Invoices are generated from orders</p>
                        </div>
                    ) : (
                        <div className="table-container fade-in">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Amount</th>
                                        <th>Tax</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order) => {
                                        const tax = Math.round((order.totalAmount || 0) * TAX_RATE);
                                        const total = (order.totalAmount || 0) + tax;
                                        return (
                                            <tr key={order.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#adb5bd' }}>
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.customerName || order.userEmail}</td>
                                                <td>{order.items?.length || 0}</td>
                                                <td style={{ fontSize: '0.85rem' }}>₹{(order.totalAmount || 0).toLocaleString()}</td>
                                                <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>₹{tax.toLocaleString()}</td>
                                                <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{total.toLocaleString()}</td>
                                                <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{formatDate(order.timestamp)}</td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)} title="View Invoice">
                                                        <FiEye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
};

export default BillingManagement;
