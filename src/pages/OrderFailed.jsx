import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiXCircle, FiRefreshCcw, FiShoppingBag } from 'react-icons/fi';
import './OrderSuccess.css'; // Reusing styles

const OrderFailed = () => {
    const navigate = useNavigate();

    return (
        <div className="page-wrapper order-success-page">
            <div className="container">
                <div className="order-success-card fade-in">
                    <div className="success-icon-wrapper" style={{ color: '#dc3545' }}>
                        <FiXCircle size={64} className="success-icon" />
                    </div>
                    
                    <h1 className="success-title">Payment Failed</h1>
                    <p className="success-message">
                        We couldn't process your payment. Don't worry, no money was deducted.
                        Please try again.
                    </p>
                    
                    <div className="success-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/checkout')}>
                            <FiRefreshCcw className="btn-icon" /> Retry Payment
                        </button>
                        <Link to="/cart" className="btn btn-secondary btn-lg">
                            <FiShoppingBag className="btn-icon" /> Return to Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderFailed;
