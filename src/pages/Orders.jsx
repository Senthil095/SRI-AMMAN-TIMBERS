import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiPackage, FiClock, FiCheck, FiTruck } from 'react-icons/fi';
import './Orders.css';

const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: <FiClock size={12} />, class: 'warning' },
    shipped: { label: 'Shipped', icon: <FiTruck size={12} />, class: 'info' },
    completed: { label: 'Completed', icon: <FiCheck size={12} />, class: 'success' },
};

const Orders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const q = query(
                    collection(db, 'orders'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const snap = await getDocs(q);
                setOrders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentUser]);

    const formatDate = (ts) => {
        if (!ts) return 'Just now';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
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
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-id-section">
                                            <FiPackage size={16} className="text-accent" />
                                            <div>
                                                <p className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="order-date">{formatDate(order.timestamp)}</p>
                                            </div>
                                        </div>
                                        <div className="order-header-right">
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
                                                {order.deliveryAddress.address}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
