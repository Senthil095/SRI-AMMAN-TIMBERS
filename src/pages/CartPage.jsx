import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
    FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft,
    FiHeart, FiShoppingCart, FiTag, FiTruck, FiShield, FiCheck
} from 'react-icons/fi';
import './CartPage.css';


// Color swatches for display
const PAINT_COLORS = [
    { hex: '#FF6B6B', name: 'Coral Bliss' },
    { hex: '#2EC4B6', name: 'Ocean Teal' },
    { hex: '#4CC9F0', name: 'Sky Dream' },
    { hex: '#FFD166', name: 'Sunny Gold' },
    { hex: '#C3B1E1', name: 'Lavender Mist' },
    { hex: '#87C38F', name: 'Sage Green' },
];

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 79;

const CartPage = () => {
    const navigate = useNavigate();
    const {
        cartItems, savedItems,
        cartTotal, cartCount,
        removeFromCart, updateQuantity,
        saveForLater, moveToCart, removeSaved,
    } = useCart();

    // Per-item state for size and color selections
    const [itemOptions, setItemOptions] = useState({});

    const getOption = (id, key, defaultVal) =>
        itemOptions[id]?.[key] ?? defaultVal;

    const setOption = (id, key, val) =>
        setItemOptions(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), [key]: val }
        }));

    // Calculations
    const subtotal = cartTotal;
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + tax + shipping;
    const savings = cartItems.reduce((sum, item) => {
        if (item.discountPrice && item.price) {
            return sum + (item.price - item.discountPrice) * item.quantity;
        }
        return sum;
    }, 0);

    // Empty cart
    if (cartItems.length === 0 && savedItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-empty-page">
                        <div className="cart-empty-illustration">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Looks like you haven't added any paints yet. Start exploring our collection!</p>
                        <div className="cart-empty-actions">
                            <Link to="/" className="btn btn-primary btn-lg">
                                <FiShoppingBag size={18} /> Browse Products
                            </Link>
                            <Link to="/paint-preview" className="btn btn-ghost btn-lg">
                                🎨 Try Paint Preview
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                {/* Page Header */}
                <div className="cart-page-header">
                    <button className="cart-back-btn" onClick={() => navigate(-1)}>
                        <FiArrowLeft size={16} /> Continue Shopping
                    </button>
                    <div className="cart-page-title-area">
                        <h1 className="cart-page-title">Shopping Cart</h1>
                        <span className="cart-page-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
                    </div>
                </div>

                <div className="cart-layout">
                    {/* ── LEFT: Cart Items ──────────────────────────────── */}
                    <div className="cart-items-section">

                        {/* Items list */}
                        {cartItems.length > 0 && (
                            <div className="cart-items-card">
                                <div className="cart-items-header">
                                    <span>Product</span>
                                    <span>Quantity</span>
                                    <span>Total</span>
                                </div>

                                {cartItems.map((item, idx) => {
                                    const unitPrice = item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price);
                                    const itemTotal = unitPrice * item.quantity;
                                    const selectedColor = getOption(item.cartKey, 'color', PAINT_COLORS[idx % PAINT_COLORS.length]);
                                    const inStock = item.stock > 0;

                                    return (
                                        <div key={item.cartKey} className="cart-item-row">
                                            {/* Product Image */}
                                            <div className="cart-item-img-col">
                                                <div className="cart-item-img-box">
                                                    {item.imageUrl
                                                        ? <img src={item.imageUrl} alt={item.name} />
                                                        : <span className="cart-item-img-placeholder">🎨</span>
                                                    }
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="cart-item-info-col">
                                                <div className="cart-item-category">{item.category}</div>
                                                <h3 className="cart-item-name">{item.name}</h3>

                                                {/* Stock status */}
                                                <div className={`cart-item-stock ${inStock ? 'in' : 'out'}`}>
                                                    {inStock
                                                        ? <><FiCheck size={11} /> In Stock</>
                                                        : '⚠ Out of Stock'
                                                    }
                                                </div>

                                                {/* Color selector */}
                                                <div className="cart-item-option-row">
                                                    <span className="cart-item-option-label">Color:</span>
                                                    <div className="cart-color-dots">
                                                        {PAINT_COLORS.map(c => (
                                                            <button
                                                                key={c.hex}
                                                                className={`cart-color-dot ${selectedColor.hex === c.hex ? 'active' : ''}`}
                                                                style={{ background: c.hex }}
                                                                title={c.name}
                                                                onClick={() => setOption(item.id, 'color', c)}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="cart-color-code">{selectedColor.hex}</span>
                                                </div>

                                                {/* Size display */}
                                                {item.selectedSize && (
                                                    <div className="cart-item-option-row">
                                                        <span className="cart-item-option-label">Size:</span>
                                                        <div className="cart-size-pills">
                                                            <span className="cart-size-pill active">{item.selectedSize.label}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Unit price */}
                                                <div className="cart-item-unit-price">
                                                    ₹{unitPrice?.toLocaleString()} / unit
                                                    {!item.selectedSize && item.discountPrice && item.price && (
                                                        <span className="cart-item-original-price">₹{item.price?.toLocaleString()}</span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="cart-item-actions">
                                                    <button
                                                        className="cart-action-btn save-btn"
                                                        onClick={() => saveForLater(item.cartKey)}
                                                    >
                                                        <FiHeart size={13} /> Save for Later
                                                    </button>
                                                    <button
                                                        className="cart-action-btn remove-btn"
                                                        onClick={() => removeFromCart(item.cartKey)}
                                                    >
                                                        <FiTrash2 size={13} /> Remove
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="cart-item-qty-col">
                                                <div className="cart-qty-control">
                                                    <button
                                                        className="cart-qty-btn"
                                                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                                                    >
                                                        <FiMinus size={13} />
                                                    </button>
                                                    <span className="cart-qty-value">{item.quantity}</span>
                                                    <button
                                                        className="cart-qty-btn"
                                                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                                        disabled={item.stock && item.quantity >= item.stock}
                                                    >
                                                        <FiPlus size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="cart-item-total-col">
                                                <span className="cart-item-total">₹{itemTotal?.toLocaleString()}</span>
                                                {item.quantity > 1 && (
                                                    <span className="cart-item-total-note">
                                                        {item.quantity} × ₹{unitPrice?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Saved for Later */}
                        {savedItems.length > 0 && (
                            <div className="cart-saved-section">
                                <h3 className="cart-saved-title">
                                    <FiHeart size={16} /> Saved for Later ({savedItems.length})
                                </h3>
                                <div className="cart-saved-grid">
                                    {savedItems.map(item => (
                                        <div key={item.cartKey} className="cart-saved-card">
                                            <div className="cart-saved-img">
                                                {item.imageUrl
                                                    ? <img src={item.imageUrl} alt={item.name} />
                                                    : <span>🎨</span>
                                                }
                                            </div>
                                            <div className="cart-saved-info">
                                                <div className="cart-saved-name">
                                                    {item.name}
                                                    {item.selectedSize && <span style={{ fontSize: '0.75rem', color: '#6c757d' }}> — {item.selectedSize.label}</span>}
                                                </div>
                                                <div className="cart-saved-price">
                                                    ₹{(item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price))?.toLocaleString()}
                                                </div>
                                                <div className="cart-saved-actions">
                                                    <button className="cart-action-btn save-btn" onClick={() => moveToCart(item.cartKey)}>
                                                        <FiShoppingCart size={12} /> Move to Cart
                                                    </button>
                                                    <button className="cart-action-btn remove-btn" onClick={() => removeSaved(item.cartKey)}>
                                                        <FiTrash2 size={12} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trust badges */}
                        <div className="cart-trust-badges">
                            <div className="trust-badge">
                                <FiTruck size={18} className="trust-icon" />
                                <div>
                                    <div className="trust-title">Free Delivery</div>
                                    <div className="trust-desc">On orders above ₹999</div>
                                </div>
                            </div>
                            <div className="trust-badge">
                                <FiShield size={18} className="trust-icon" />
                                <div>
                                    <div className="trust-title">Genuine Products</div>
                                    <div className="trust-desc">100% authentic paints</div>
                                </div>
                            </div>
                            <div className="trust-badge">
                                <FiTag size={18} className="trust-icon" />
                                <div>
                                    <div className="trust-title">Best Price</div>
                                    <div className="trust-desc">Price match guarantee</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Order Summary ──────────────────────────── */}
                    {cartItems.length > 0 && (
                        <div className="cart-summary-section">
                            <div className="cart-summary-card">
                                <h2 className="cart-summary-title">Order Summary</h2>

                                <div className="cart-summary-rows">
                                    <div className="cart-summary-row">
                                        <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    {savings > 0 && (
                                        <div className="cart-summary-row savings">
                                            <span>You Save</span>
                                            <span>−₹{savings.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="cart-summary-row">
                                        <span>GST (18%)</span>
                                        <span>₹{Math.round(tax).toLocaleString()}</span>
                                    </div>
                                    <div className="cart-summary-row">
                                        <span>Shipping</span>
                                        <span className={shipping === 0 ? 'free-shipping' : ''}>
                                            {shipping === 0 ? 'FREE' : `₹${shipping}`}
                                        </span>
                                    </div>
                                    {shipping > 0 && (
                                        <div className="cart-summary-free-hint">
                                            Add ₹{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for free shipping
                                        </div>
                                    )}
                                    <div className="cart-summary-divider" />
                                    <div className="cart-summary-row total">
                                        <span>Total</span>
                                        <span>₹{Math.round(total).toLocaleString()}</span>
                                    </div>
                                    <div className="cart-summary-tax-note">Inclusive of all taxes</div>
                                </div>

                                {/* Checkout Button */}
                                <Link to="/checkout" className="cart-checkout-cta">
                                    Proceed to Checkout →
                                </Link>
                                <Link to="/" className="cart-continue-cta">
                                    ← Continue Shopping
                                </Link>

                                {/* Payment Icons */}
                                <div className="cart-payment-section">
                                    <p className="cart-payment-label">We Accept</p>
                                    <div className="cart-payment-icons">
                                        <div className="payment-icon" title="Visa">VISA</div>
                                        <div className="payment-icon" title="Mastercard">MC</div>
                                        <div className="payment-icon" title="UPI">UPI</div>
                                        <div className="payment-icon" title="Net Banking">NB</div>
                                        <div className="payment-icon" title="Cash on Delivery">COD</div>
                                    </div>
                                </div>

                                {/* Security note */}
                                <div className="cart-secure-note">
                                    <FiShield size={14} /> Secure & Encrypted Checkout
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartPage;
