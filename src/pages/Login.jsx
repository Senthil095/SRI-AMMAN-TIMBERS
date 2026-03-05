import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to sign in with Google');
        }
    };



    return (
        <div className="auth-page">
            <div className="auth-blob auth-blob-1" />
            <div className="auth-blob auth-blob-2" />
            <div className="auth-blob auth-blob-3" />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">P</div>
                    <span className="logo-text">Paint<span>Pro</span></span>
                </div>

                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                {error && (
                    <div className="auth-error">
                        <FiAlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? <span className="btn-spinner" /> : 'Sign In'}
                    </button>

                    <div className="auth-divider">OR</div>

                    <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
                        <FcGoogle size={20} /> Sign in with Google
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Create one</Link>
                </p>

                <div className="auth-demo-hint">
                    💡 Admin: Set role to "admin" in Firestore after signup
                </div>
            </div>
        </div>
    );
};

export default Login;
