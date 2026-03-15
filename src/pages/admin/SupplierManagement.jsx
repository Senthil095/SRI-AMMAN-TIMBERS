import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const EMPTY_FORM = {
    supplierName: '', companyName: '', phone: '', email: '', address: '', productsSupplied: '',
};

const SupplierManagement = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const fetchSuppliers = async () => {
        try {
            const snap = await getDocs(collection(db, 'suppliers'));
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.supplierName || !form.phone) {
            toast.error('Please fill in required fields');
            return;
        }
        setSaving(true);
        try {
            const data = { ...form };
            if (editId) {
                await updateDoc(doc(db, 'suppliers', editId), data);
                toast.success('Supplier updated!');
            } else {
                await addDoc(collection(db, 'suppliers'), { ...data, createdAt: new Date().toISOString() });
                toast.success('Supplier added!');
            }
            resetForm();
            fetchSuppliers();
        } catch {
            toast.error('Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (sup) => {
        setForm({
            supplierName: sup.supplierName || '',
            companyName: sup.companyName || '',
            phone: sup.phone || '',
            email: sup.email || '',
            address: sup.address || '',
            productsSupplied: sup.productsSupplied || '',
        });
        setEditId(sup.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (sup) => {
        if (!window.confirm(`Delete supplier ${sup.supplierName}?`)) return;
        try {
            await deleteDoc(doc(db, 'suppliers', sup.id));
            toast.success('Supplier deleted');
            fetchSuppliers();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const filtered = suppliers.filter(s =>
        (s.supplierName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.companyName || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout title="Supplier Management" subtitle="Manage your suppliers">
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{suppliers.length} Suppliers</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add Supplier</>}
                </button>
            </div>

            {showForm && (
                <div className="admin-form-card fade-in">
                    <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}>
                        {editId ? 'Edit Supplier' : 'Add New Supplier'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Supplier Name *</label>
                                <input className="form-input" placeholder="Supplier name" value={form.supplierName}
                                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input className="form-input" placeholder="Company" value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone *</label>
                                <input className="form-input" placeholder="+91 98765 43210" value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" placeholder="email@example.com" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Address</label>
                                <input className="form-input" placeholder="Full address" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Products Supplied</label>
                                <input className="form-input" placeholder="e.g. Asian Paints, Berger Paints" value={form.productsSupplied}
                                    onChange={(e) => setForm({ ...form, productsSupplied: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> {editId ? 'Update' : 'Add'} Supplier</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search suppliers..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🚚</div>
                    <h3>No suppliers found</h3>
                    <p>Add your first supplier to get started</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Company</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Products</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="emp-avatar" style={{ background: 'linear-gradient(135deg, #2ec4b6, #1aab9e)' }}>
                                                {(s.supplierName || '?')[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.supplierName}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{s.companyName || '—'}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{s.phone}</td>
                                    <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{s.email || '—'}</td>
                                    <td style={{ fontSize: '0.8rem', color: '#6c757d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.productsSupplied || '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(s)}><FiEdit2 size={14} /></button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}><FiTrash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default SupplierManagement;
