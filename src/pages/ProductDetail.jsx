import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiCheck, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const snap = await getDoc(doc(db, 'products', id));
                if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Auto-select first size when product loads
    React.useEffect(() => {
        if (product?.sizes?.length > 0 && !selectedSize) {
            setSelectedSize(product.sizes[0]);
        }
    }, [product]);

    const handleAddToCart = () => {
        addToCart(product, selectedSize);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    };

    const displayPrice = selectedSize ? selectedSize.price : (product?.discountPrice || product?.price);
    const savings = product?.discountPrice
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : null;

    const currentStock = selectedSize ? (selectedSize.stock !== undefined ? selectedSize.stock : product?.stock) : product?.stock;
    const stockStatus = currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'in';
    const stockLabel = currentStock === 0 ? 'Out of Stock' : currentStock <= 5 ? `Only ${currentStock} left` : 'In Stock';

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="container product-detail-page">
                    <div className="product-detail-skeleton">
                        <div className="skeleton" style={{ height: '400px', borderRadius: '24px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                            <div className="skeleton" style={{ height: '36px', width: '80%' }} />
                            <div className="skeleton" style={{ height: '36px', width: '60%' }} />
                            <div className="skeleton" style={{ height: '40px', width: '40%' }} />
                            <div className="skeleton" style={{ height: '100px' }} />
                            <div className="skeleton" style={{ height: '52px', borderRadius: '14px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="page-wrapper">
                <div className="container">
                    <div className="product-not-found">
                        <div className="empty-icon">🎨</div>
                        <h2>Product Not Found</h2>
                        <p>This product may have been removed or doesn't exist.</p>
                        <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: '16px' }}>
                            Back to Shop
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="container product-detail-page">
                {/* Breadcrumb */}
                <div className="breadcrumb fade-in">
                    <Link to="/">Home</Link>
                    <FiChevronRight size={14} />
                    <Link to="/">Products</Link>
                    <FiChevronRight size={14} />
                    <span style={{ color: '#ff6b6b' }}>{product.name}</span>
                </div>

                <div className="product-detail-grid fade-in">
                    {/* Image */}
                    <div className="product-detail-img-wrapper">
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="product-detail-img" />
                            : <div className="product-detail-img-placeholder">🎨</div>
                        }
                    </div>

                    {/* Info */}
                    <div className="product-detail-info">
                        <span className="product-detail-category">{product.category}</span>
                        <h1 className="product-detail-name">{product.name}</h1>

                        <div className="product-detail-pricing">
                            <span className="detail-price">₹{displayPrice?.toLocaleString()}</span>
                            {!selectedSize && product.discountPrice && (
                                <span className="detail-original">₹{product.price?.toLocaleString()}</span>
                            )}
                            {!selectedSize && savings && (
                                <span className="detail-savings">Save {savings}%</span>
                            )}
                        </div>

                        {/* Size selector */}
                        {product.sizes?.length > 0 && (
                            <div className="product-detail-sizes">
                                <span className="product-detail-sizes-label">Select Size:</span>
                                <div className="product-size-pills">
                                    {product.sizes.map(s => (
                                        <button
                                            key={s.label}
                                            className={`product-size-pill ${selectedSize?.label === s.label ? 'active' : ''}`}
                                            onClick={() => setSelectedSize(s)}
                                        >
                                            <span className="size-pill-label">{s.label}</span>
                                            <span className="size-pill-price">₹{s.price?.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="product-detail-stock">
                            <div className={`stock-dot ${stockStatus}`} />
                            <span style={{ color: stockStatus === 'in' ? '#16a34a' : stockStatus === 'low' ? '#b45309' : '#dc2626', fontWeight: 600 }}>
                                {stockLabel}
                            </span>
                            {currentStock > 0 && (
                                <span style={{ color: '#adb5bd' }}>· {currentStock} units available</span>
                            )}
                        </div>

                        {product.description && (
                            <div className="product-detail-desc">
                                {product.description}
                            </div>
                        )}

                        <div className="product-detail-actions">
                            <button
                                className={`add-to-cart-detail-btn ${added ? 'added' : ''}`}
                                onClick={handleAddToCart}
                                disabled={currentStock === 0}
                            >
                                {added
                                    ? <><FiCheck size={18} /> Added to Cart!</>
                                    : <><FiShoppingCart size={18} /> Add to Cart</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
