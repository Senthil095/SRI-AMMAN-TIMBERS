import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiPackage, FiSettings, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
    const { currentUser, userRole, logout } = useAuth();
    const { cartCount } = useCart();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setDropdownOpen(false);
    }, [location]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/');
        } catch {
            toast.error('Failed to logout');
        }
    };

    const isAdmin = userRole === 'admin';
    const initials = currentUser?.email?.[0]?.toUpperCase() || 'U';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">P</div>
                    <span className="logo-text">Paint<span>Pro</span></span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Shop
                    </Link>
                    <Link to="/paint-preview" className={`nav-link ${location.pathname === '/paint-preview' ? 'active' : ''}`}>
                        🎨 Paint Preview
                    </Link>
                    {currentUser && !isAdmin && (
                        <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                            My Orders
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                            Admin Panel
                        </Link>
                    )}
                </div>

                {/* Right Actions */}
                <div className="navbar-actions">
                    {/* Cart Button */}
                    {!isAdmin && (
                        <Link
                            to="/cart"
                            className="cart-btn"
                            aria-label="View cart"
                        >
                            <FiShoppingCart size={19} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                    )}

                    {/* User Area */}
                    {currentUser ? (
                        <div className="user-dropdown-wrapper" ref={dropdownRef}>
                            <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className="user-avatar">{initials}</div>
                                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                    {currentUser.email?.split('@')[0]}
                                </span>
                                <FiChevronDown size={14} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {dropdownOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-email">{currentUser.email}</div>
                                        <div className="dropdown-role">{isAdmin ? 'Admin' : 'Customer'}</div>
                                    </div>
                                    {!isAdmin && (
                                        <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <FiPackage size={15} /> My Orders
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <FiSettings size={15} /> Dashboard
                                        </Link>
                                    )}
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <FiLogOut size={15} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="auth-btn-login">Login</Link>
                            <Link to="/signup" className="auth-btn-signup">Sign Up</Link>
                        </>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    <Link to="/" className="mobile-nav-link">Shop</Link>
                    {currentUser && !isAdmin && (
                        <Link to="/orders" className="mobile-nav-link">My Orders</Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className="mobile-nav-link">Admin Panel</Link>
                    )}
                    {!isAdmin && (
                        <Link
                            to="/cart"
                            className="mobile-nav-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            Cart {cartCount > 0 && `(${cartCount})`}
                        </Link>
                    )}
                    <div className="mobile-menu-divider" />
                    {!currentUser ? (
                        <>
                            <Link to="/login" className="mobile-nav-link">Login</Link>
                            <Link to="/signup" className="mobile-nav-link" style={{ color: '#ff6b6b', fontWeight: 600 }}>Sign Up</Link>
                        </>
                    ) : (
                        <button
                            className="mobile-nav-link"
                            style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%', color: '#dc2626' }}
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
