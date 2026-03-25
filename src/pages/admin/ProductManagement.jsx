import React, { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';
import './ProductManagement.css';

const CATEGORIES = ['Interior', 'Exterior', 'Primer', 'Enamel', 'Texture', 'Wood Finish', 'Other'];

const PRESET_SIZES = [
    { label: '1L Can', litres: 1, stock: '' },
    { label: '4L Can', litres: 4, stock: '' },
    { label: '10L Bucket', litres: 10, stock: '' },
    { label: '20L Bucket', litres: 20, stock: '' },
];

const EMPTY_FORM = {
    name: '', category: 'Interior',
    description: '', sizes: [],
    colorHex: '#FF6B6B',
};

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        let timeoutId;
        try {
            // Safety timeout
            timeoutId = setTimeout(() => {
                console.warn('Products fetch timed out');
                setLoading(false);
            }, 5000);

            const snapshot = await getDocs(collection(db, 'products'));
            clearTimeout(timeoutId);

            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Fetch Products Error:", err);
            clearTimeout(timeoutId);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async () => {
        if (!imageFile) return null;
        setUploading(true);
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const task = uploadBytesResumable(storageRef, imageFile);
            task.on('state_changed',
                (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                (err) => { setUploading(false); reject(err); },
                async () => {
                    const url = await getDownloadURL(task.snapshot.ref);
                    setUploading(false);
                    resolve(url);
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || form.sizes.length === 0) {
            toast.error('Please provide a name and at least one size option.');
            return;
        }
        
        // Ensure all sizes have valid data
        const validSizes = form.sizes.filter(s => s.label && s.litres && s.price);
        if (validSizes.length === 0) {
            toast.error('Please ensure sizes have a Label, Litres, and Price.');
            return;
        }
        setSaving(true);
        try {
            // Helper to convert Drive sharing links to direct image links
            const processUrl = (url) => {
                if (!url) return '';
                // Check if Google Drive link
                if (url.includes('drive.google.com') && url.includes('/file/d/')) {
                    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
                    }
                }
                return url;
            };

            const finalUrl = processUrl(imageUrl);

            // Derive global properties for legacy compatibility/easier sorting
            const basePrice = Math.min(...validSizes.map(s => Number(s.price)));
            const totalStock = validSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

            const data = {
                name: form.name,
                category: form.category,
                description: form.description,
                imageUrl: finalUrl,
                colorHex: form.colorHex || '#FF6B6B',
                price: basePrice, // Store lowest price as base price
                stock: totalStock, // Aggregate stock
                sizes: validSizes.map(s => ({
                    label: s.label,
                    litres: Number(s.litres),
                    price: Number(s.price),
                    stock: Number(s.stock) || 0,
                })),
            };
            if (editId) {
                await updateDoc(doc(db, 'products', editId), data);
                toast.success('Product updated!');
            } else {
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
                toast.success('Product added!');
            }
            resetForm();
            fetchProducts();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setForm({
            name: product.name || '',
            category: product.category || 'Interior',
            description: product.description || '',
            sizes: product.sizes || [],
            colorHex: product.colorHex || '#FF6B6B',
        });
        setImageUrl(product.imageUrl || '');
        setEditId(product.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'products', product.id));
            if (product.imageUrl) {
                try {
                    const imgRef = ref(storage, product.imageUrl);
                    await deleteObject(imgRef);
                } catch { } // Ignore if image not found in storage (might be external link)
            }
            toast.success('Product deleted');
            fetchProducts();
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setImageUrl('');
        setShowForm(false);
    };

    return (
        <AdminLayout title="Product Management" subtitle="Manage your paint inventory">
            {/* Header */}
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{products.length} Products</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add Product</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="admin-form-card fade-in">
                    <h3 style={{ marginBottom: '24px', color: '#212529', fontWeight: 700 }}>
                        {editId ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Product Name *</label>
                                <input className="form-input" placeholder="e.g. Asian Paints Royale" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select className="form-select" value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Paint Color *</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="color"
                                        value={form.colorHex}
                                        onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                                        style={{ width: '48px', height: '48px', border: 'none', borderRadius: '12px', cursor: 'pointer', padding: 0 }}
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="#FF6B6B"
                                        value={form.colorHex}
                                        onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                                        style={{ flex: 1, fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Product Image URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                {imageUrl && (
                                    <div className="image-preview-wrapper" style={{ marginTop: '10px' }}>
                                        <img src={imageUrl} alt="Preview" className="image-preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" placeholder="Product details, coverage, finish type..."
                                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                            </div>

                            {/* ── Available Sizes ──────────────── */}
                            <div className="form-group full-width">
                                <label className="form-label">Available Sizes (Litre Options)</label>
                                <div className="sizes-presets">
                                    {PRESET_SIZES.map(ps => {
                                        const alreadyAdded = form.sizes.some(s => s.label === ps.label);
                                        return (
                                            <button
                                                key={ps.label}
                                                type="button"
                                                className={`size-preset-btn ${alreadyAdded ? 'added' : ''}`}
                                                disabled={alreadyAdded}
                                                onClick={() => setForm({
                                                    ...form,
                                                    sizes: [...form.sizes, { label: ps.label, litres: ps.litres, price: '', stock: '' }]
                                                })}
                                            >
                                                {alreadyAdded ? '✓ ' : '+ '}{ps.label}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        className="size-preset-btn custom"
                                        onClick={() => setForm({
                                            ...form,
                                            sizes: [...form.sizes, { label: '', litres: '', price: '', stock: '' }]
                                        })}
                                    >
                                        + Custom Size
                                    </button>
                                </div>

                                {form.sizes.length > 0 && (
                                    <div className="sizes-list">
                                        {form.sizes.map((size, idx) => (
                                            <div key={idx} className="size-row">
                                                <input
                                                    className="form-input size-input"
                                                    placeholder="Label (e.g. 5L Can)"
                                                    value={size.label}
                                                    onChange={(e) => {
                                                        const updated = [...form.sizes];
                                                        updated[idx] = { ...updated[idx], label: e.target.value };
                                                        setForm({ ...form, sizes: updated });
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    className="form-input size-input"
                                                    placeholder="Litres"
                                                    value={size.litres}
                                                    min="0"
                                                    onChange={(e) => {
                                                        const updated = [...form.sizes];
                                                        updated[idx] = { ...updated[idx], litres: e.target.value };
                                                        setForm({ ...form, sizes: updated });
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    className="form-input size-input"
                                                    placeholder="Price (₹)"
                                                    value={size.price}
                                                    min="0"
                                                    onChange={(e) => {
                                                        const updated = [...form.sizes];
                                                        updated[idx] = { ...updated[idx], price: e.target.value };
                                                        setForm({ ...form, sizes: updated });
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    className="form-input size-input"
                                                    placeholder="Stock"
                                                    value={size.stock}
                                                    min="0"
                                                    onChange={(e) => {
                                                        const updated = [...form.sizes];
                                                        updated[idx] = { ...updated[idx], stock: e.target.value };
                                                        setForm({ ...form, sizes: updated });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="size-remove-btn"
                                                    onClick={() => setForm({
                                                        ...form,
                                                        sizes: form.sizes.filter((_, i) => i !== idx)
                                                    })}
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> {editId ? 'Update' : 'Save'} Product</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Products Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎨</div>
                    <h3>No products yet</h3>
                    <p>Add your first product to get started</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="product-thumb">
                                                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span>🎨</span>}
                                            </div>
                                            {p.colorHex && (
                                                <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: p.colorHex, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                            )}
                                            <div>
                                                <p style={{ fontWeight: 600, color: '#212529', fontSize: '0.875rem' }}>{p.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>
                                                    {p.description?.slice(0, 40)}...
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-info">{p.category}</span></td>
                                    <td style={{ fontWeight: 600 }}>
                                        {p.sizes?.length > 0 
                                            ? `From ₹${Math.min(...p.sizes.map(s => s.price)).toLocaleString()}` 
                                            : p.price ? `₹${p.price.toLocaleString()}` : '—'}
                                    </td>
                                    <td style={{ color: '#4ade80' }}>
                                        {p.sizes?.length || 0} Sizes
                                    </td>
                                    <td>
                                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>
                                                <FiTrash2 size={14} />
                                            </button>
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

export default ProductManagement;
