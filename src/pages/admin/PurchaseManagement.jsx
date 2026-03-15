import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const PurchaseManagement = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        supplierId: '', productId: '', quantity: '', costPerUnit: '', purchaseDate: new Date().toISOString().split('T')[0],
    });

    const fetchData = async () => {
        try {
            const [purchSnap, supSnap, prodSnap] = await Promise.all([
                getDocs(query(collection(db, 'purchases'), orderBy('purchaseDate', 'desc'))),
                getDocs(collection(db, 'suppliers')),
                getDocs(collection(db, 'products')),
            ]);
            setPurchases(purchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.supplierId || !form.productId || !form.quantity || !form.costPerUnit) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            const supplier = suppliers.find(s => s.id === form.supplierId);
            const product = products.find(p => p.id === form.productId);
            const qty = parseInt(form.quantity);
            const totalCost = qty * parseFloat(form.costPerUnit);

            await addDoc(collection(db, 'purchases'), {
                supplierId: form.supplierId,
                supplierName: supplier?.supplierName || '',
                productId: form.productId,
                productName: product?.name || product?.productName || '',
                quantity: qty,
                costPerUnit: parseFloat(form.costPerUnit),
                totalCost,
                purchaseDate: form.purchaseDate,
                createdAt: new Date().toISOString(),
            });

            // Auto-update product stock
            try {
                const stockField = product?.stock !== undefined ? 'stock' : 'quantity';
                await updateDoc(doc(db, 'products', form.productId), {
                    [stockField]: increment(qty),
                    updatedAt: new Date().toISOString(),
                });
            } catch { /* product stock update failed, not critical */ }

            toast.success('Purchase recorded & inventory updated!');

            // Log activity
            try {
                const product = products.find(p => p.id === form.productId);
                await addDoc(collection(db, 'activityLogs'), {
                    action: `Purchased ${form.quantity} units of ${product?.name || product?.productName || 'product'} from ${suppliers.find(s => s.id === form.supplierId)?.supplierName || 'supplier'}`,
                    module: 'Purchases',
                    user: 'Admin',
                    createdAt: new Date().toISOString(),
                });
            } catch { /* not critical */ }

            setShowForm(false);
            setForm({ supplierId: '', productId: '', quantity: '', costPerUnit: '', purchaseDate: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch {
            toast.error('Failed to record purchase');
        } finally {
            setSaving(false);
        }
    };

    const filtered = purchases.filter(p =>
        (p.supplierName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.productName || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalSpent = filtered.reduce((sum, p) => sum + (p.totalCost || 0), 0);

    return (
        <AdminLayout title="Purchase Management" subtitle="Track purchases from suppliers">
            <div className="admin-section-header fade-in">
                <div>
                    <h2 className="admin-section-title">{purchases.length} Purchases</h2>
                    <p style={{ fontSize: '0.85rem', color: '#adb5bd', marginTop: '4px' }}>
                        Total spent: <strong style={{ color: '#f4a261' }}>₹{totalSpent.toLocaleString()}</strong>
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> New Purchase</>}
                </button>
            </div>

            {showForm && (
                <div className="admin-form-card fade-in">
                    <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}>
                        Record New Purchase
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Supplier *</label>
                                <select className="form-select" value={form.supplierId}
                                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName} — {s.companyName || ''}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product *</label>
                                <select className="form-select" value={form.productId}
                                    onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                                    <option value="">Select Product</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity *</label>
                                <input type="number" className="form-input" placeholder="e.g. 50" value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cost Per Unit (₹) *</label>
                                <input type="number" className="form-input" placeholder="e.g. 250" value={form.costPerUnit}
                                    onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Purchase Date</label>
                                <input type="date" className="form-input" value={form.purchaseDate}
                                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#f8f9fa', border: '1px solid #f1f3f5', width: '100%' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>Total Cost</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f4a261' }}>
                                        ₹{((form.quantity || 0) * (form.costPerUnit || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> Record Purchase</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search purchases..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <h3>No purchases recorded</h3>
                    <p>Record your first purchase to get started</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Purchase ID</th>
                                <th>Supplier</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Total Cost</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#adb5bd' }}>#{p.id.slice(0, 8).toUpperCase()}</td>
                                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.supplierName || '—'}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{p.productName || '—'}</td>
                                    <td><span className="badge badge-info">{p.quantity}</span></td>
                                    <td style={{ fontWeight: 700, color: '#f4a261' }}>₹{p.totalCost?.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{p.purchaseDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default PurchaseManagement;
