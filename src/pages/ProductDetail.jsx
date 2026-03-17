import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiCheck, FiChevronRight, FiTruck, FiShield, FiAward, FiMinus, FiPlus, FiHeart, FiShare2, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PaintCalculator from '../components/PaintCalculator';
import './ProductDetail.css';

const TRUST_BADGES = [
    { icon: <FiTruck size={20} />, title: 'Free Delivery', desc: 'On orders above ₹999', color: '#2ec4b6' },
    { icon: <FiShield size={20} />, title: 'Genuine Product', desc: '100% Authentic', color: '#ff6b6b' },
    { icon: <FiAward size={20} />, title: 'Best Quality', desc: 'Premium Grade', color: '#9b5de5' },
    { icon: <FiPackage size={20} />, title: 'Secure Packing', desc: 'Safe delivery', color: '#ffd166' },
];

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isFav, setIsFav] = useState(false);
    const [imgZoom, setImgZoom] = useState(false);

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
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (product?.sizes?.length > 0 && !selectedSize) {
            setSelectedSize(product.sizes[0]);
        }
    }, [product]);

    const handleAddToCart = () => {
        if (product?.sizes?.length > 0 && !selectedSize) {
            toast.error('Please select a size first');
            return;
        }
        for (let i = 0; i < quantity; i++) {
            addToCart(product, selectedSize);
        }
        setAdded(true);
        toast.success(`${quantity} item${quantity > 1 ? 's' : ''} added to cart!`);
        setTimeout(() => setAdded(false), 1800);
    };

    const displayPrice = selectedSize ? selectedSize.price : (product?.sizes?.[0]?.price || product?.price);
    const currentStock = selectedSize ? selectedSize.stock : (product?.sizes?.[0]?.stock || product?.stock);
    const stockStatus = currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'in';
    const stockLabel = currentStock === 0 ? 'Out of Stock' : currentStock <= 5 ? `Only ${currentStock} left — Hurry!` : 'In Stock';

    if (loading) {
        return (
            <div className="pd-page">
                <div className="container">
                    <div className="pd-skeleton">
                        <div className="pd-skeleton-img skeleton" />
                        <div className="pd-skeleton-info">
                            <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                            <div className="skeleton" style={{ height: '36px', width: '80%' }} />
                            <div className="skeleton" style={{ height: '28px', width: '40%' }} />
                            <div className="skeleton" style={{ height: '60px' }} />
                            <div className="skeleton" style={{ height: '52px', borderRadius: '14px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="pd-page">
                <div className="container">
                    <div className="pd-not-found">
                        <div className="pd-not-found-icon">🎨</div>
                        <h2>Product Not Found</h2>
                        <p>This product may have been removed or doesn't exist.</p>
                        <Link to="/" className="pd-back-btn">← Back to Shop</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-page">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="pd-breadcrumb">
                    <Link to="/">Home</Link>
                    <FiChevronRight size={13} />
                    <Link to="/">Products</Link>
                    <FiChevronRight size={13} />
                    <span>{product.name}</span>
                </nav>

                <div className="pd-grid">
                    {/* ── Left: Product Image ───────────────────────── */}
                    <div className="pd-image-section">
                        <div className="pd-image-main">
                            {product.imageUrl
                                ? <img src={product.imageUrl} alt={product.name} className="pd-img" />
                                : <div className="pd-img-placeholder">🎨</div>
                            }
                            <div className="pd-img-badge">Hover to zoom</div>
                        </div>

                        {/* Action buttons on image */}
                        <div className="pd-img-actions">
                            <button
                                className={`pd-img-action-btn ${isFav ? 'active' : ''}`}
                                onClick={() => { setIsFav(!isFav); toast(isFav ? 'Removed from wishlist' : '❤️ Added to wishlist!'); }}
                                title="Wishlist"
                            >
                                <FiHeart size={18} fill={isFav ? '#ff6b6b' : 'none'} />
                            </button>
                            <button
                                className="pd-img-action-btn"
                                onClick={() => { navigator.clipboard.writeText(window.location.href); toast('🔗 Link copied!'); }}
                                title="Share"
                            >
                                <FiShare2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ── Right: Product Info ────────────────────────── */}
                    <div className="pd-info">
                        <span className="pd-category">{product.category}</span>
                        <h1 className="pd-name">{product.name}</h1>

                        {/* Price */}
                        <div className="pd-price-block">
                            <span className="pd-price">₹{displayPrice?.toLocaleString()}</span>
                            <span className="pd-price-note">Inclusive of all taxes</span>
                        </div>

                        {/* Stock */}
                        <div className={`pd-stock-badge ${stockStatus}`}>
                            <div className={`pd-stock-dot ${stockStatus}`} />
                            <span>{stockLabel}</span>
                            {currentStock > 0 && <span className="pd-stock-units">· {currentStock} units available</span>}
                        </div>

                        {/* Divider */}
                        <div className="pd-divider" />

                        {/* Size selector */}
                        {product.sizes?.length > 0 && (
                            <div className="pd-sizes">
                                <span className="pd-section-label">Select Size</span>
                                <div className="pd-size-grid">
                                    {product.sizes.map(s => (
                                        <button
                                            key={s.label}
                                            className={`pd-size-card ${selectedSize?.label === s.label ? 'active' : ''} ${s.stock === 0 ? 'disabled' : ''}`}
                                            onClick={() => s.stock > 0 && setSelectedSize(s)}
                                            disabled={s.stock === 0}
                                        >
                                            <span className="pd-size-label">{s.label}</span>
                                            <span className="pd-size-price">₹{s.price?.toLocaleString()}</span>
                                            {s.stock === 0 && <span className="pd-size-oos">Out of stock</span>}
                                            {selectedSize?.label === s.label && <FiCheck className="pd-size-check" size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="pd-quantity-section">
                            <span className="pd-section-label">Quantity</span>
                            <div className="pd-qty-control">
                                <button
                                    className="pd-qty-btn"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <FiMinus size={16} />
                                </button>
                                <span className="pd-qty-value">{quantity}</span>
                                <button
                                    className="pd-qty-btn"
                                    onClick={() => setQuantity(q => Math.min(currentStock || 10, q + 1))}
                                    disabled={quantity >= (currentStock || 10)}
                                >
                                    <FiPlus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Total */}
                        {displayPrice && (
                            <div className="pd-total-row">
                                <span>Total</span>
                                <span className="pd-total-price">₹{(displayPrice * quantity).toLocaleString()}</span>
                            </div>
                        )}

                        {/* Paint Calculator */}
                        <PaintCalculator />

                        {/* Add to Cart */}
                        <div className="pd-actions">
                            <button
                                className={`pd-add-btn ${added ? 'added' : ''}`}
                                onClick={handleAddToCart}
                                disabled={currentStock === 0}
                            >
                                {added
                                    ? <><FiCheck size={20} /> Added to Cart!</>
                                    : <><FiShoppingCart size={20} /> Add to Cart</>
                                }
                            </button>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="pd-description">
                                <span className="pd-section-label">Product Details</span>
                                <p className="pd-desc-text">{product.description}</p>
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="pd-trust-grid">
                            {TRUST_BADGES.map((b, i) => (
                                <div key={i} className="pd-trust-badge">
                                    <div className="pd-trust-icon" style={{ color: b.color, background: `${b.color}15` }}>
                                        {b.icon}
                                    </div>
                                    <div>
                                        <p className="pd-trust-title">{b.title}</p>
                                        <p className="pd-trust-desc">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
