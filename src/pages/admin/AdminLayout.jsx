import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    FiGrid, FiPackage, FiUsers, FiCalendar, FiDollarSign, FiLogOut, FiChevronRight,
    FiShoppingCart, FiUserCheck, FiBox, FiTruck, FiShoppingBag, FiFileText,
    FiBarChart2, FiActivity, FiSettings, FiBell
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const NAV_SECTIONS = [
    {
        label: 'Main',
        items: [
            { to: '/admin', icon: <FiGrid size={18} />, label: 'Dashboard', exact: true },
            { to: '/admin/products', icon: <FiPackage size={18} />, label: 'Products' },
            { to: '/admin/orders', icon: <FiShoppingCart size={18} />, label: 'Orders' },
            { to: '/admin/customers', icon: <FiUserCheck size={18} />, label: 'Customers' },
        ],
    },
    {
        label: 'Workforce',
        items: [
            { to: '/admin/employees', icon: <FiUsers size={18} />, label: 'Employees' },
            { to: '/admin/attendance', icon: <FiCalendar size={18} />, label: 'Attendance' },
            { to: '/admin/salary', icon: <FiDollarSign size={18} />, label: 'Salary' },
        ],
    },
    {
        label: 'Inventory & Supply',
        items: [
            { to: '/admin/inventory', icon: <FiBox size={18} />, label: 'Inventory' },
            { to: '/admin/suppliers', icon: <FiTruck size={18} />, label: 'Suppliers' },
            { to: '/admin/purchases', icon: <FiShoppingBag size={18} />, label: 'Purchases' },
        ],
    },
    {
        label: 'Finance & Reports',
        items: [
            { to: '/admin/billing', icon: <FiFileText size={18} />, label: 'Billing' },
            { to: '/admin/reports', icon: <FiBarChart2 size={18} />, label: 'Reports' },
        ],
    },
    {
        label: 'System',
        items: [
            { to: '/admin/activity-logs', icon: <FiActivity size={18} />, label: 'Activity Logs' },
            { to: '/admin/settings', icon: <FiSettings size={18} />, label: 'Settings' },
        ],
    },
];

const AdminLayout = ({ children, title, subtitle }) => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const bellRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Try fetching from notifications collection first
                const snap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10)));
                const firestoreNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Also generate dynamic notifications from real data
                const dynamicNotifs = [];
                try {
                    const [prodSnap, orderSnap] = await Promise.all([
                        getDocs(collection(db, 'products')),
                        getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(5))),
                    ]);
                    // Low stock alerts
                    prodSnap.docs.forEach(d => {
                        const p = d.data();
                        const stock = p.stock || p.quantity || 0;
                        if (stock < 10) {
                            dynamicNotifs.push({
                                id: `low-${d.id}`,
                                message: `⚠️ ${p.name || p.productName} is low on stock (${stock} left)`,
                                type: 'warning',
                                read: stock > 0,
                                createdAt: new Date().toISOString(),
                            });
                        }
                    });
                    // Recent order notifications
                    orderSnap.docs.slice(0, 3).forEach(d => {
                        const o = d.data();
                        if (o.status === 'Pending') {
                            dynamicNotifs.push({
                                id: `order-${d.id}`,
                                message: `📦 New order from ${o.customerName || o.userEmail || 'Customer'}`,
                                type: 'info',
                                read: false,
                                createdAt: o.timestamp,
                            });
                        }
                    });
                } catch { /* ignore dynamic generation errors */ }

                setNotifications([...dynamicNotifs, ...firestoreNotifs].slice(0, 15));
            } catch {
                // notifications collection may not exist yet
            }
        };
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

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
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label} className="sidebar-section">
                            <div className="sidebar-section-label">{section.label}</div>
                            {section.items.map((item) => (
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
                        </div>
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
                    <div className="topbar-actions" ref={bellRef}>
                        <button
                            className="notification-bell"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FiBell size={20} />
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-dropdown-header">
                                    <h4>Notifications</h4>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{notifications.length} total</span>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">No notifications yet</div>
                                ) : (
                                    <div className="notification-list">
                                        {notifications.map((n) => {
                                            let timeStr = '—';
                                            try {
                                                if (n.createdAt?.toDate) timeStr = n.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                                else if (n.createdAt?.seconds) timeStr = new Date(n.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                                else if (typeof n.createdAt === 'string') timeStr = new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                            } catch { /* ignore */ }
                                            return (
                                                <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                                                    <p className="notification-text">{n.message || 'Notification'}</p>
                                                    <span className="notification-time">{timeStr}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
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
