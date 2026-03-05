import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiGrid, FiPackage, FiUsers, FiCalendar, FiDollarSign, FiLogOut, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const NAV_ITEMS = [
    { to: '/admin', icon: <FiGrid size={18} />, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: <FiPackage size={18} />, label: 'Products' },
    { to: '/admin/employees', icon: <FiUsers size={18} />, label: 'Employees' },
    { to: '/admin/attendance', icon: <FiCalendar size={18} />, label: 'Attendance' },
    { to: '/admin/salary', icon: <FiDollarSign size={18} />, label: 'Salary' },
];

const AdminLayout = ({ children, title, subtitle }) => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">P</div>
                    <div>
                        <div className="sidebar-logo-text">PaintPro</div>
                        <div className="sidebar-logo-sub">Admin Panel</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.exact}
                            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span className="nav-item-label">{item.label}</span>
                            <FiChevronRight size={14} className="nav-item-arrow" />
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="sidebar-user-info">
                            <p className="sidebar-user-email">{currentUser?.email || 'Admin User'}</p>
                            <span className="sidebar-user-role">Administrator</span>
                        </div>
                    </div>
                    {currentUser && (
                        <button className="sidebar-logout" onClick={handleLogout}>
                            <FiLogOut size={16} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-topbar">
                    <div>
                        <h1 className="admin-page-title">{title}</h1>
                        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
                    </div>
                </div>
                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
