import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import './AdminLogin.css';

const AdminLogin = () => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate a brief network delay for better UX
        setTimeout(() => {
            const validId = import.meta.env.VITE_ADMIN_ID;
            const validPassword = import.meta.env.VITE_ADMIN_PASSWORD;

            if (adminId === validId && password === validPassword) {
                sessionStorage.setItem('adminToken', 'true');
                navigate('/admin');
            } else {
                setError('Invalid Admin Credentials');
            }
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-logo-icon">S</div>
                    <h2>Admin Portal</h2>
                    <p>Secure login for Sri Amman Paints administrators</p>
                </div>

                <form className="admin-login-form" onSubmit={handleLogin}>
                    {error && <div className="admin-error-message">{error}</div>}

                    <div className="admin-input-group">
                        <label>Admin ID</label>
                        <div className="admin-input-wrapper">
                            <FiUser className="admin-input-icon" />
                            <input
                                type="text"
                                placeholder="Enter your Admin ID"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="admin-input-group">
                        <label>Password</label>
                        <div className="admin-input-wrapper">
                            <FiLock className="admin-input-icon" />
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={`admin-login-btn ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Authenticating...' : (
                            <>Login to Dashboard <FiArrowRight /></>
                        )}
                    </button>
                </form>
            </div>
            <div className="admin-login-bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        </div>
    );
};

export default AdminLogin;
