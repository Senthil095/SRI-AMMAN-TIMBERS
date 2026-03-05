import React, { useState, useEffect } from 'react';
import {
    collection, getDocs, addDoc, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiDollarSign, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SalaryManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [form, setForm] = useState({
        employeeId: '',
        salaryMonth: '',
        amountPaid: '',
        paymentDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empSnap, salSnap] = await Promise.all([
                    getDocs(query(collection(db, 'employees'), orderBy('fullName'))),
                    getDocs(query(collection(db, 'salaryHistory'), orderBy('paymentDate', 'desc'))),
                ]);
                const emps = empSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setEmployees(emps);
                setSalaryHistory(salSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                if (emps.length > 0) {
                    setForm((f) => ({ ...f, employeeId: emps[0].id, amountPaid: emps[0].monthlySalary || '' }));
                    setSelectedEmployee(emps[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleEmployeeChange = (id) => {
        const emp = employees.find((e) => e.id === id);
        setForm((f) => ({ ...f, employeeId: id, amountPaid: emp?.monthlySalary || '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.employeeId || !form.salaryMonth || !form.amountPaid || !form.paymentDate) {
            toast.error('Please fill in all fields');
            return;
        }
        setSaving(true);
        try {
            const emp = employees.find((e) => e.id === form.employeeId);
            await addDoc(collection(db, 'salaryHistory'), {
                employeeId: form.employeeId,
                employeeName: emp?.fullName || '',
                salaryMonth: form.salaryMonth,
                amountPaid: parseFloat(form.amountPaid),
                paymentDate: form.paymentDate,
                createdAt: new Date().toISOString(),
            });
            toast.success('Salary payment recorded!');
            setShowForm(false);
            // Refresh salary history
            const snap = await getDocs(query(collection(db, 'salaryHistory'), orderBy('paymentDate', 'desc')));
            setSalaryHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
            toast.error('Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const filteredHistory = filterEmployee
        ? salaryHistory.filter((r) => r.employeeId === filterEmployee)
        : salaryHistory;

    const totalPaid = filteredHistory.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    return (
        <AdminLayout title="Salary Management" subtitle="Record and track salary payments">
            {/* Header */}
            <div className="admin-section-header fade-in">
                <div>
                    <h2 className="admin-section-title">{salaryHistory.length} Payment Records</h2>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(248,249,250,0.5)', marginTop: '4px' }}>
                        Total paid: <strong style={{ color: '#f4a261' }}>₹{totalPaid.toLocaleString()}</strong>
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : <><FiPlus size={16} /> Record Payment</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="admin-form-card fade-in">
                    <h3 style={{ marginBottom: '24px', color: '#f8f9fa', fontWeight: 700 }}>
                        Record Salary Payment
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Employee *</label>
                                <select className="form-select" value={form.employeeId}
                                    onChange={(e) => handleEmployeeChange(e.target.value)}>
                                    {employees.map((e) => (
                                        <option key={e.id} value={e.id}>{e.fullName} — {e.jobRole}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Salary Month *</label>
                                <select className="form-select" value={form.salaryMonth}
                                    onChange={(e) => setForm({ ...form, salaryMonth: e.target.value })}>
                                    <option value="">Select Month</option>
                                    {MONTHS.map((m, i) => {
                                        const year = new Date().getFullYear();
                                        const val = `${m} ${year}`;
                                        return <option key={m} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount Paid (₹) *</label>
                                <input type="number" className="form-input" value={form.amountPaid}
                                    onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Date *</label>
                                <input type="date" className="form-input" value={form.paymentDate}
                                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> Record Payment</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter */}
            <div style={{ marginBottom: '20px' }} className="fade-in">
                <select className="form-select" style={{ width: 'auto', minWidth: '220px' }}
                    value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                    <option value="">All Employees</option>
                    {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filteredHistory.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h3>No salary records</h3>
                    <p>Record your first payment to get started</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Salary Month</th>
                                <th>Amount Paid</th>
                                <th>Payment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="emp-avatar">{r.employeeName?.[0]?.toUpperCase()}</div>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.employeeName}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>{r.salaryMonth}</td>
                                    <td style={{ fontWeight: 700, color: '#4ade80', fontSize: '1rem' }}>
                                        ₹{r.amountPaid?.toLocaleString()}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'rgba(248,249,250,0.5)' }}>{r.paymentDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default SalaryManagement;
