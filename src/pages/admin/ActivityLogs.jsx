import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSearch } from 'react-icons/fi';
import './Admin.css';

const MODULE_COLORS = {
    Products: 'info',
    Orders: 'warning',
    Employees: 'success',
    Attendance: 'purple',
    Salary: 'coral',
    Inventory: 'info',
    Settings: 'danger',
};

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterModule, setFilterModule] = useState('All');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(100)));
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch {
                // Collection may not exist yet — show empty state
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatDateTime = (ts) => {
        if (!ts) return { date: '—', time: '—' };
        try {
            let d;
            if (ts.toDate) d = ts.toDate();
            else if (ts.seconds) d = new Date(ts.seconds * 1000);
            else d = new Date(ts);
            if (isNaN(d)) return { date: '—', time: '—' };
            return {
                date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            };
        } catch { return { date: '—', time: '—' }; }
    };

    const modules = [...new Set(logs.map(l => l.module).filter(Boolean))];

    const filtered = logs.filter(l => {
        const matchSearch = (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.user || '').toLowerCase().includes(search.toLowerCase());
        const matchModule = filterModule === 'All' || l.module === filterModule;
        return matchSearch && matchModule;
    });

    return (
        <AdminLayout title="Activity Logs" subtitle="Track admin actions and system events">
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{logs.length} Log Entries</h2>
            </div>

            <div className="filter-bar fade-in">
                <div className="search-box" style={{ maxWidth: '300px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search logs..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 'auto', minWidth: '160px' }}
                    value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
                    <option value="All">All Modules</option>
                    {modules.map(m => <option key={m}>{m}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No activity logs</h3>
                    <p>Admin actions will be recorded here automatically</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Module</th>
                                <th>Date</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log) => {
                                const { date, time } = formatDateTime(log.createdAt);
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="emp-avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: 'linear-gradient(135deg, #9b5de5, #7c3aed)' }}>
                                                    {(log.user || 'A')[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user || 'Admin'}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{log.action || '—'}</td>
                                        <td>
                                            <span className={`badge badge-${MODULE_COLORS[log.module] || 'info'}`}>
                                                {log.module || 'System'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#6c757d' }}>{date}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{time}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default ActivityLogs;
