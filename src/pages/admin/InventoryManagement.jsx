import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';
import './Admin.css';

const LOW_STOCK_THRESHOLD = 10;

// Safe timestamp formatter — handles Firestore Timestamp, ISO strings, and raw objects
const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
        if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (typeof ts === 'string') return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return '—';
    } catch {
        return '—';
    }
};

const InventoryManagement = () => {
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStock, setFilterStock] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodSnap, purchSnap, orderSnap] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'purchases')),
                    getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'))),
                ]);
                setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setPurchases(purchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate stock added per product from purchases
    const getStockAdded = (productId) => {
        return purchases
            .filter(p => p.productId === productId)
            .reduce((sum, p) => sum + (p.quantity || 0), 0);
    };

    // Calculate stock sold per product from delivered/confirmed orders
    const getStockSold = (productId, productName) => {
        return orders
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => {
                return sum + (o.items || [])
                    .filter(item => item.productId === productId ||
                        (item.name || item.productName || '').toLowerCase() === (productName || '').toLowerCase())
                    .reduce((s, item) => s + (item.quantity || 1), 0);
            }, 0);
    };

    // Get the latest update timestamp for a product (from purchases or product itself)
    const getLastUpdated = (product) => {
        const relatedPurchases = purchases
            .filter(p => p.productId === product.id)
            .sort((a, b) => {
                const tA = a.createdAt || a.purchaseDate || '';
                const tB = b.createdAt || b.purchaseDate || '';
                return tB > tA ? 1 : -1;
            });
        if (relatedPurchases.length > 0) {
            return relatedPurchases[0].createdAt || relatedPurchases[0].purchaseDate;
        }
        return product.updatedAt || product.createdAt;
    };

    // Build inventory data
    const inventoryData = products.map(p => {
        const baseStock = p.stock || p.quantity || 0;
        const stockAdded = getStockAdded(p.id);
        const pName = p.name || p.productName || '';
        const stockSold = getStockSold(p.id, pName);
        // Current stock = base stock in DB (which gets updated by purchases/orders)
        // We also show purchased/sold for transparency
        return {
            ...p,
            currentStock: baseStock,
            stockAdded,
            stockSold,
            lastUpdated: getLastUpdated(p),
        };
    });

    const filtered = inventoryData.filter(p => {
        const matchSearch = (p.name || p.productName || '').toLowerCase().includes(search.toLowerCase());
        const stock = p.currentStock;
        const matchFilter = filterStock === 'All' ||
            (filterStock === 'Low' && stock < LOW_STOCK_THRESHOLD && stock > 0) ||
            (filterStock === 'In Stock' && stock >= LOW_STOCK_THRESHOLD) ||
            (filterStock === 'Out of Stock' && stock === 0);
        return matchSearch && matchFilter;
    });

    const totalStock = inventoryData.reduce((sum, p) => sum + p.currentStock, 0);
    const lowStockCount = inventoryData.filter(p => p.currentStock < LOW_STOCK_THRESHOLD && p.currentStock > 0).length;
    const outOfStockCount = inventoryData.filter(p => p.currentStock === 0).length;
    const totalPurchased = inventoryData.reduce((sum, p) => sum + p.stockAdded, 0);
    const totalSold = inventoryData.reduce((sum, p) => sum + p.stockSold, 0);

    return (
        <AdminLayout title="Inventory Management" subtitle="Track product stock levels">
            {/* Summary Cards */}
            <div className="admin-stats-grid fade-in">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(76,201,240,0.12)', color: '#4cc9f0' }}>📦</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#4cc9f0' }}>{totalStock}</h3>
                        <p>Current Stock</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>📥</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#4ade80' }}>{totalPurchased}</h3>
                        <p>Total Purchased</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(244,162,97,0.12)', color: '#f4a261' }}>📤</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#f4a261' }}>{totalSold}</h3>
                        <p>Total Sold</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>⚠️</div>
                    <div className="stat-info">
                        <h3 style={{ color: '#f59e0b' }}>{lowStockCount}</h3>
                        <p>Low Stock</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search products..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 'auto', minWidth: '160px' }}
                    value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                    <option value="All">All Stock</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No products found</h3>
                    <p>Add products to track inventory</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Purchased</th>
                                <th>Sold</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const stock = p.currentStock;
                                const isLow = stock < LOW_STOCK_THRESHOLD && stock > 0;
                                const isOut = stock === 0;
                                return (
                                    <tr key={p.id} style={isLow || isOut ? { background: isOut ? 'rgba(220,38,38,0.04)' : 'rgba(245,158,11,0.04)' } : {}}>
                                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name || p.productName || 'Unknown'}</td>
                                        <td><span className="badge badge-info">{p.category || '—'}</span></td>
                                        <td style={{ fontWeight: 600, color: '#f4a261' }}>₹{(p.price || 0).toLocaleString()}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#4ade80' }}>{p.stockAdded}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#f4a261' }}>{p.stockSold}</td>
                                        <td style={{ fontWeight: 700, color: isOut ? '#dc2626' : isLow ? '#f59e0b' : '#16a34a' }}>
                                            {stock}
                                        </td>
                                        <td>
                                            {isOut ? (
                                                <span className="badge badge-danger">Out of Stock</span>
                                            ) : isLow ? (
                                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <FiAlertTriangle size={10} /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="badge badge-success">In Stock</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{formatTimestamp(p.lastUpdated)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default InventoryManagement;
