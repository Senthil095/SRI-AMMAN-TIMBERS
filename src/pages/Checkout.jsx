import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiMapPin, FiPhone, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
    const { currentUser } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleOrder = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
            toast.error('Please fill in all delivery details');
            return;
        }
        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'orders'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                items: cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price),
                    quantity: item.quantity,
                    imageUrl: item.imageUrl || '',
                    selectedSize: item.selectedSize || null,
                })),
                totalAmount: cartTotal,
                deliveryAddress: form,
                status: 'pending',
                timestamp: serverTimestamp(),
            });

            // Decrement stock using transaction to ensure size arrays are updated safely
            await runTransaction(db, async (transaction) => {
                // First, read all the product documents to get current sizes array
                const productRefs = cartItems.map(item => doc(db, 'products', item.id));
                const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

                // Then, perform updates
                cartItems.forEach((item, index) => {
                    const productDoc = productDocs[index];
                    if (!productDoc.exists()) return;

                    const productData = productDoc.data();
                    const updateData = {};

                    if (item.selectedSize && productData.sizes?.length > 0) {
                        const updatedSizes = productData.sizes.map(size => {
                            if (size.label === item.selectedSize.label) {
                                return { ...size, stock: Math.max(0, (size.stock || 0) - item.quantity) };
                            }
                            return size;
                        });
                        updateData.sizes = updatedSizes;
                        // Reduce total top-level stock as well for compatibility
                        updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
                    } else {
                        updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
                    }

                    transaction.update(productRefs[index], updateData);
                });
            });

            clearCart();
            setSuccess(true);
            toast.success('Order placed successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="page-wrapper">
                <div className="container">
                    <div className="order-success fade-in">
                        <div className="success-icon">
                            <FiCheck size={40} />
                        </div>
                        <h1>Order Placed!</h1>
                        <p>Your order has been placed successfully. We'll notify you when it ships.</p>
                        <div className="success-actions">
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/orders')}>
                                View My Orders
                            </button>
                            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="container">
                <div className="checkout-header fade-in">
                    <h1 className="section-title">Checkout</h1>
                    <p className="section-subtitle">Complete your order details below</p>
                </div>

                <div className="checkout-grid fade-in">
                    {/* Delivery Form */}
                    <div className="checkout-form-section">
                        <div className="checkout-section-title">
                            <FiMapPin size={18} />
                            <h2>Delivery Details</h2>
                        </div>
                        <form onSubmit={handleOrder} className="checkout-form">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    name="name"
                                    className="form-input"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <div className="input-wrapper">
                                    <FiPhone className="input-icon" size={16} />
                                    <input
                                        name="phone"
                                        className="form-input with-icon"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    className="form-textarea"
                                    placeholder="House no., Street, Area"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        name="city"
                                        className="form-input"
                                        placeholder="Chennai"
                                        value={form.city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PIN Code</label>
                                    <input
                                        name="pincode"
                                        className="form-input"
                                        placeholder="600001"
                                        value={form.pincode}
                                        onChange={handleChange}
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-full btn-lg"
                                disabled={loading}
                            >
                                {loading ? <span className="btn-spinner" /> : 'Place Order'}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary-section">
                        <div className="checkout-section-title">
                            <FiShoppingBag size={18} />
                            <h2>Order Summary</h2>
                        </div>
                        <div className="order-items">
                            {cartItems.map((item) => {
                                const price = item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price);
                                return (
                                    <div key={item.cartKey} className="order-item">
                                        <div className="order-item-img">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} />
                                            ) : (
                                                <span>🎨</span>
                                            )}
                                        </div>
                                        <div className="order-item-info">
                                            <p className="order-item-name">
                                                {item.name}
                                                {item.selectedSize && <span style={{ fontSize: '0.75rem', color: '#6c757d' }}> — {item.selectedSize.label}</span>}
                                            </p>
                                            <p className="order-item-qty">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="order-item-price">
                                            ₹{(price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="order-totals">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="total-row">
                                <span>Delivery</span>
                                <span className="text-green">Free</span>
                            </div>
                            <div className="total-divider" />
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
