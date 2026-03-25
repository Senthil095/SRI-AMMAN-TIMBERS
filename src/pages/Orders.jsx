import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPackage, FiClock, FiCheck, FiTruck, FiBox, FiXCircle, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import './Orders.css';

const STATUS_CONFIG = {
    'Pending': { label: 'Pending', icon: <FiClock size={12} />, class: 'warning' },
    'Confirmed': { label: 'Confirmed', icon: <FiCheckCircle size={12} />, class: 'info' },
    'Packed': { label: 'Packed', icon: <FiBox size={12} />, class: 'purple' },
    'Out for Delivery': { label: 'Out for Delivery', icon: <FiTruck size={12} />, class: 'coral' },
    'Delivered': { label: 'Delivered', icon: <FiCheck size={12} />, class: 'success' },
    'Cancelled': { label: 'Cancelled', icon: <FiXCircle size={12} />, class: 'danger' },
};

const PAYMENT_BADGE = {
    'Paid': 'success',
    'Failed': 'danger',
    'Pending': 'warning',
};

const Orders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }

            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
                const res = await fetch(`${backendUrl}/api/orders?userId=${currentUser.uid}`);
                const data = await res.json();

                if (res.ok && data.orders) {
                    // Filter out failed payments
                    const validOrders = data.orders.filter(o => o.paymentStatus !== 'Failed');
                    setOrders(validOrders);
                } else {
                    console.error('Failed to fetch orders:', data.error);
                }
            } catch (err) {
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentUser]);

    const formatDate = (ts) => {
        if (!ts) return 'Just now';
        const date = new Date(ts);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="page-wrapper">
            <div className="container">
                <div className="orders-header fade-in">
                    <h1 className="section-title">My Orders</h1>
                    <p className="section-subtitle">Track all your Sri Amman Paints purchases</p>
                </div>

                {loading ? (
                    <div className="loading-center">
                        <div className="spinner" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state fade-in">
                        <div className="empty-icon">📦</div>
                        <h3>No orders yet</h3>
                        <p>Your order history will appear here</p>
                    </div>
                ) : (
                    <div className="orders-list fade-in">
                        {orders.map((order) => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                            const paymentBadge = PAYMENT_BADGE[order.paymentStatus] || 'warning';
                            return (
                                <Link to={`/order/${order.id}`} key={order.id} className="order-card-link">
                                <div className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-id-section">
                                            <FiPackage size={16} className="text-accent" />
                                            <div>
                                                <p className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="order-date">{formatDate(order.timestamp)}</p>
                                            </div>
                                        </div>
                                        <div className="order-header-right">
                                            <span className={`badge badge-${paymentBadge}`}>
                                                {order.paymentStatus || 'Pending'}
                                            </span>
                                            <span className={`badge badge-${status.class}`}>
                                                {status.icon} {status.label}
                                            </span>
                                            <span className="order-total">₹{order.totalAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="order-items-list">
                                        {order.items?.map((item, i) => (
                                            <div key={i} className="order-line-item">
                                                <div className="order-line-img">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} />
                                                    ) : (
                                                        <span>🎨</span>
                                                    )}
                                                </div>
                                                <div className="order-line-info">
                                                    <span className="order-line-name">{item.name}</span>
                                                    <span className="order-line-qty">× {item.quantity}</span>
                                                </div>
                                                <span className="order-line-price">
                                                    ₹{(item.price * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {order.deliveryAddress && (
                                        <div className="order-delivery">
                                            <span className="delivery-label">Delivery to:</span>
                                            <span className="delivery-addr">
                                                {order.deliveryAddress.name && `${order.deliveryAddress.name}, `}
                                                {order.deliveryAddress.address}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                                            </span>
                                        </div>
                                    )}

                                    {order.razorpayPaymentId && (
                                        <div className="order-delivery" style={{ borderTop: 'none', paddingTop: 0 }}>
                                            <span className="delivery-label">Payment ID:</span>
                                            <span className="delivery-addr" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                                {order.razorpayPaymentId}
                                            </span>
                                        </div>
                                    )}

                                    <div className="order-track-link">
                                        Track Order <FiChevronRight size={14} />
                                    </div>
                                </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
