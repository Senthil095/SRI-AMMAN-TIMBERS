import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiMapPin, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Checkout.css';

// Dynamically load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { currentUser } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
            // Load Razorpay Script
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error('Failed to load Razorpay window. Are you online?');
                setLoading(false);
                return;
            }

            // Prepare items and total
            const orderItems = cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price),
                quantity: item.quantity,
                imageUrl: item.imageUrl || '',
                selectedSize: item.selectedSize || null,
            }));

            // Step 1: Create Order in Backend
            const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
            console.log("Calling backend at:", `${backendUrl}/api/create-order`);
            
            const payload = {
                userId: currentUser?.uid || 'guest',
                userEmail: currentUser?.email || 'guest@example.com',
                items: orderItems,
                totalAmount: cartTotal,
                deliveryAddress: form
            };
            
            console.log("Payload:", payload);

            const orderResponse = await fetch(`${backendUrl}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    items: orderItems,
                    totalAmount: cartTotal,
                    deliveryAddress: form
                }),
            });

            console.log("Response status:", orderResponse.status);
            const orderData = await orderResponse.json();
            console.log("Order Data:", orderData);

            if (!orderResponse.ok) {
                 toast.error(orderData.error || 'Could not initiate connection to backend');
                 setLoading(false);
                 return;
            }

            // Step 2: Open Razorpay Checkout Modal
            const options = {
                key: orderData.key_id, // Enter the Key ID generated from the Dashboard
                amount: orderData.amount, // Amount is in currency subunits. Default currency is INR.
                currency: 'INR',
                name: 'Sri Amman Timbers & Paints',
                description: 'Test Transaction',
                order_id: orderData.razorpayOrderId,
                handler: async function (response) {
                    // Step 3: Verify Payment in Backend
                    try {
                        const verifyRes = await fetch(`${backendUrl}/api/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                payment_id: response.razorpay_payment_id,
                                order_id: response.razorpay_order_id,
                                signature: response.razorpay_signature,
                                firebase_order_id: orderData.orderId
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // Payment confirmed and database updated
                            clearCart();
                            navigate('/order-success', {
                                state: {
                                    orderDetails: {
                                        orderId: orderData.orderId,
                                        paymentId: response.razorpay_payment_id
                                    }
                                }
                            });
                        } else {
                            toast.error('Payment verification failed.');
                            navigate('/order-failed');
                        }
                    } catch(err) {
                        toast.error('An error occurred during verification.');
                        navigate('/order-failed');
                    }
                },
                prefill: {
                    name: form.name,
                    email: currentUser.email,
                    contact: form.phone
                },
                theme: {
                    color: '#0056b3'
                },
                modal: {
                    ondismiss: function() {
                        // User closed the Razorpay modal
                        toast.error('Payment cancelled.');
                        navigate('/order-failed');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                 toast.error('Payment failed: ' + response.error.description);
                 navigate('/order-failed');
            });

            rzp.open();
            
        } catch (err) {
            console.error("Checkout Error:", err);
            toast.error('Failed to initiate checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                                {loading ? <span className="btn-spinner" /> : 'Place Order & Pay'}
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
