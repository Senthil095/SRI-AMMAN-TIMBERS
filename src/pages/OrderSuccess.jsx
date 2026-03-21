import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiHome } from 'react-icons/fi';
import './OrderSuccess.css'; // Let's create a minimal css file for this

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);

    useEffect(() => {
        // Find order details passed via navigation state
        if (location.state && location.state.orderDetails) {
             setOrderDetails(location.state.orderDetails);
        }
    }, [location.state]);

    return (
        <div className="page-wrapper order-success-page">
            <div className="container">
                <div className="order-success-card fade-in">
                    <div className="success-icon-wrapper">
                        <FiCheckCircle size={64} className="success-icon" />
                    </div>
                    
                    <h1 className="success-title">Order Placed Successfully!</h1>
                    <p className="success-message">Thank you for shopping with us. Your order is being processed.</p>
                    
                    {orderDetails && (
                        <div className="order-details-box">
                            <div className="detail-row">
                                <span className="detail-label">Order ID:</span>
                                <span className="detail-value font-mono">{orderDetails.orderId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Payment ID:</span>
                                <span className="detail-value font-mono">{orderDetails.paymentId}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="success-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/orders')}>
                            <FiPackage className="btn-icon" /> View My Orders
                        </button>
                        <Link to="/" className="btn btn-secondary btn-lg">
                            <FiHome className="btn-icon" /> Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
