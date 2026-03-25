import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiPackage, FiCheckCircle, FiBox, FiTruck, FiCheck, FiXCircle, FiClock, FiMapPin, FiCreditCard, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './OrderTracking.css';

const STEPS = [
    { key: 'Confirmed', label: 'Confirmed', icon: <FiCheckCircle size={20} />, desc: 'Order has been confirmed' },
    { key: 'Packed', label: 'Packed', icon: <FiBox size={20} />, desc: 'Items are packed and ready' },
    { key: 'Out for Delivery', label: 'Out for Delivery', icon: <FiTruck size={20} />, desc: 'On the way to you' },
    { key: 'Delivered', label: 'Delivered', icon: <FiCheck size={20} />, desc: 'Successfully delivered' },
];

const STATUS_ORDER = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

const OrderTracking = () => {
    const { orderId } = useParams();
    const { currentUser } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const prevStatusRef = useRef(null);
    const intervalRef = useRef(null);

    const fetchOrder = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
            const res = await fetch(`${backendUrl}/api/orders/${orderId}`);
            const data = await res.json();

            if (res.ok && data.order) {
                // Check for status change notification
                if (prevStatusRef.current && prevStatusRef.current !== data.order.status) {
                    toast.success(`Order status updated to "${data.order.status}"!`, { duration: 4000, icon: '🔔' });
                }
                prevStatusRef.current = data.order.status;
                setOrder(data.order);
                setError(null);
            } else {
                setError(data.error || 'Order not found');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            if (!silent) setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        // Auto-refresh every 30 seconds
        intervalRef.current = setInterval(() => fetchOrder(true), 30000);
        return () => clearInterval(intervalRef.current);
    }, [orderId]);

    const formatDate = (ts) => {
        if (!ts) return '—';
        const date = new Date(ts);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStepIndex = (status) => {
        const idx = STATUS_ORDER.indexOf(status);
        return idx >= 0 ? idx : 0;
    };

    const isCancelled = order?.status === 'Cancelled';
    const currentStepIndex = order ? getStepIndex(order.status) : 0;

    return (
        <div className="page-wrapper">
            <div className="container">
                <div className="tracking-header fade-in">
                    <Link to="/orders" className="tracking-back-link">
                        <FiArrowLeft size={18} /> Back to My Orders
                    </Link>
                    <div className="tracking-title-row">
                        <div>
                            <h1 className="section-title">Track Order</h1>
                            {order && (
                                <p className="tracking-order-id">
                                    <FiPackage size={14} /> Order #{order.id.slice(0, 8).toUpperCase()}
                                </p>
                            )}
                        </div>
                        <button className="tracking-refresh-btn" onClick={() => fetchOrder(true)} title="Refresh">
                            <FiRefreshCw size={16} /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : error ? (
                    <div className="empty-state fade-in">
                        <div className="empty-icon">❌</div>
                        <h3>{error}</h3>
                        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>Go to My Orders</Link>
                    </div>
                ) : order && (
                    <div className="tracking-content fade-in">
                        {/* ── Progress Tracker ───────────────── */}
                        <div className="tracking-progress-card">
                            <div className="tracking-status-header">
                                <span className={`tracking-current-status ${isCancelled ? 'cancelled' : ''}`}>
                                    {isCancelled ? <FiXCircle size={16} /> : <FiClock size={16} />}
                                    {isCancelled ? 'Order Cancelled' : `Status: ${order.status}`}
                                </span>
                                {order.timestamp && (
                                    <span className="tracking-placed-date">Placed on {formatDate(order.timestamp)}</span>
                                )}
                            </div>

                            {!isCancelled ? (
                                <div className="tracking-steps">
                                    {STEPS.map((step, i) => {
                                        const stepIdx = STATUS_ORDER.indexOf(step.key);
                                        const isCompleted = currentStepIndex >= stepIdx;
                                        const isCurrent = currentStepIndex === stepIdx;
                                        return (
                                            <div key={step.key} className={`tracking-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                                <div className="step-icon-wrapper">
                                                    <div className="step-icon">
                                                        {isCompleted ? <FiCheck size={18} /> : step.icon}
                                                    </div>
                                                    {i < STEPS.length - 1 && <div className={`step-line ${currentStepIndex > stepIdx ? 'filled' : ''}`} />}
                                                </div>
                                                <div className="step-info">
                                                    <span className="step-label">{step.label}</span>
                                                    <span className="step-desc">{step.desc}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="tracking-cancelled-msg">
                                    <FiXCircle size={32} />
                                    <p>This order has been cancelled.</p>
                                </div>
                            )}
                        </div>

                        {/* ── Order Details ────────────────────── */}
                        <div className="tracking-details-grid">
                            {/* Items */}
                            <div className="tracking-detail-card">
                                <h3 className="tracking-detail-title">
                                    <FiPackage size={16} /> Order Items
                                </h3>
                                <div className="tracking-items-list">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="tracking-item">
                                            <div className="tracking-item-img">
                                                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>🎨</span>}
                                            </div>
                                            <div className="tracking-item-info">
                                                <span className="tracking-item-name">{item.name}</span>
                                                <span className="tracking-item-qty">Qty: {item.quantity} {item.sizeLabel ? `· ${item.sizeLabel}` : ''}</span>
                                            </div>
                                            <span className="tracking-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="tracking-total-row">
                                    <span>Total</span>
                                    <span className="tracking-total-value">₹{order.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Delivery + Payment */}
                            <div className="tracking-detail-card">
                                {order.deliveryAddress && (
                                    <>
                                        <h3 className="tracking-detail-title">
                                            <FiMapPin size={16} /> Delivery Address
                                        </h3>
                                        <div className="tracking-address">
                                            {order.deliveryAddress.name && <p className="addr-name">{order.deliveryAddress.name}</p>}
                                            <p className="addr-line">{order.deliveryAddress.address}</p>
                                            <p className="addr-line">{order.deliveryAddress.city} — {order.deliveryAddress.pincode}</p>
                                            {order.deliveryAddress.phone && <p className="addr-phone">📞 {order.deliveryAddress.phone}</p>}
                                        </div>
                                    </>
                                )}

                                <h3 className="tracking-detail-title" style={{ marginTop: '24px' }}>
                                    <FiCreditCard size={16} /> Payment Details
                                </h3>
                                <div className="tracking-payment">
                                    <div className="payment-row">
                                        <span>Payment Status</span>
                                        <span className={`badge badge-${order.paymentStatus === 'Paid' ? 'success' : order.paymentStatus === 'Failed' ? 'danger' : 'warning'}`}>
                                            {order.paymentStatus || 'Pending'}
                                        </span>
                                    </div>
                                    {order.razorpayPaymentId && (
                                        <div className="payment-row">
                                            <span>Payment ID</span>
                                            <span className="payment-id">{order.razorpayPaymentId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Auto-refresh notice */}
                        <p className="tracking-auto-refresh">
                            <FiRefreshCw size={12} /> This page auto-refreshes every 30 seconds
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
