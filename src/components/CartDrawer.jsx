import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import './CartDrawer.css';

const CartDrawer = () => {
    const { cartItems, cartTotal, cartCount, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

    if (!isCartOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />

            {/* Drawer */}
            <div className="cart-drawer">
                {/* Header */}
                <div className="cart-header">
                    <div className="cart-title">
                        <FiShoppingBag size={20} />
                        <h2>Your Cart</h2>
                        {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
                    </div>
                    <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Items */}
                {cartItems.length === 0 ? (
                    <div className="cart-empty">
                        <div className="cart-empty-icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Add some beautiful paints to get started</p>
                        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setIsCartOpen(false)}>
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cartItems.map((item) => {
                                const price = item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price);
                                return (
                                    <div key={item.cartKey} className="cart-item">
                                        <div className="cart-item-img">
                                            {item.imageUrl
                                                ? <img src={item.imageUrl} alt={item.name} />
                                                : <span>🎨</span>
                                            }
                                        </div>
                                        <div className="cart-item-info">
                                            <div className="cart-item-name">{item.name}</div>
                                            {item.selectedSize && (
                                                <div className="cart-item-size-label">{item.selectedSize.label}</div>
                                            )}
                                            <div className="cart-item-price">
                                                ₹{(price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="cart-item-controls">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>
                                                <FiMinus size={11} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}>
                                                <FiPlus size={11} />
                                            </button>
                                            <button className="cart-item-remove" onClick={() => removeFromCart(item.cartKey)}>
                                                <FiTrash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="cart-footer">
                            <div className="cart-subtotal">
                                <span className="cart-subtotal-label">Subtotal ({cartCount} items)</span>
                                <span className="cart-subtotal-amount">₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <Link
                                to="/checkout"
                                className="cart-checkout-btn"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Proceed to Checkout
                            </Link>
                            <button className="cart-continue-btn" onClick={() => setIsCartOpen(false)}>
                                Continue Shopping
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
