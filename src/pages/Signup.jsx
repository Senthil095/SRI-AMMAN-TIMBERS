import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
    const { signup, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.password || !form.confirm) {
            setError('Please fill in all fields'); return;
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match'); return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters'); return;
        }
        setLoading(true);
        try {
            await signup(form.email, form.password, form.name);
            toast.success('Account created! Welcome to Sri Amman Paints!');
            navigate('/');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
            toast.success('Account created! Welcome to Sri Amman Paints!');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to sign up with Google');
        }
    };



    return (
        <div className="auth-page">
            <div className="auth-blob auth-blob-1" />
            <div className="auth-blob auth-blob-2" />
            <div className="auth-blob auth-blob-3" />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">S</div>
                    <span className="logo-text">Sri Amman <span>Paints</span></span>
                </div>

                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join thousands of happy customers</p>

                {error && (
                    <div className="auth-error">
                        <FiAlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
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
                        <label className="form-label">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="password-wrapper">
                            <input
                                name="password"
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={handleChange}
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
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            name="confirm"
                            type="password"
                            className="form-input"
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? <span className="btn-spinner" /> : 'Create Account'}
                    </button>

                    <div className="auth-divider">OR</div>

                    <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
                        <FcGoogle size={20} /> Sign up with Google
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
