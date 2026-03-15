import React, { useState, useEffect } from 'react';
import {
    collection, getDocs, addDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WORKING_DAYS_PER_MONTH = 26;
const LATE_PENALTY_PER_DAY = 50;

const SalaryManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [form, setForm] = useState({
        employeeId: '',
        salaryMonth: '',
        overtime: 0,
        deductions: 0,
        paymentDate: new Date().toISOString().split('T')[0],
    });
    const [calculatedSalary, setCalculatedSalary] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empSnap, salSnap, attSnap] = await Promise.all([
                    getDocs(query(collection(db, 'employees'), orderBy('fullName'))),
                    getDocs(query(collection(db, 'salaryHistory'), orderBy('paymentDate', 'desc'))),
                    getDocs(collection(db, 'attendance')),
                ]);
                const emps = empSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setEmployees(emps);
                setSalaryHistory(salSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                if (emps.length > 0) {
                    setForm((f) => ({ ...f, employeeId: emps[0].id }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate salary based on attendance when employee/month changes
    useEffect(() => {
        if (!form.employeeId || !form.salaryMonth) {
            setCalculatedSalary(null);
            return;
        }

        const emp = employees.find(e => e.id === form.employeeId);
        if (!emp) { setCalculatedSalary(null); return; }

        const baseSalary = emp.monthlySalary || 0;
        const monthYear = form.salaryMonth; // e.g. "March 2026"

        // Parse month/year from selection
        const parts = monthYear.split(' ');
        const monthName = parts[0];
        const year = parseInt(parts[1]);
        const monthIndex = MONTHS.indexOf(monthName);

        // Filter attendance for this employee and month
        const monthRecords = attendance.filter(a => {
            if (a.employeeId !== form.employeeId && a.employeeName !== emp.fullName) return false;
            // Parse date from attendance record
            const dateStr = a.date || '';
            const d = new Date(dateStr);
            return d.getMonth() === monthIndex && d.getFullYear() === year;
        });

        const presentDays = monthRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const lateDays = monthRecords.filter(a => a.status === 'Late').length;
        const absentDays = WORKING_DAYS_PER_MONTH - presentDays;

        // Formula: (Base Salary / Working Days) * Present Days + Overtime - Deductions - Late Penalties
        const perDay = baseSalary / WORKING_DAYS_PER_MONTH;
        const earnedSalary = Math.round(perDay * presentDays);
        const latePenalty = lateDays * LATE_PENALTY_PER_DAY;
        const overtime = parseFloat(form.overtime) || 0;
        const deductions = parseFloat(form.deductions) || 0;
        const finalSalary = Math.max(0, earnedSalary + overtime - deductions - latePenalty);

        setCalculatedSalary({
            baseSalary,
            presentDays,
            absentDays,
            lateDays,
            earnedSalary,
            latePenalty,
            overtime,
            deductions,
            finalSalary,
        });
    }, [form.employeeId, form.salaryMonth, form.overtime, form.deductions, employees, attendance]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.employeeId || !form.salaryMonth || !calculatedSalary) {
            toast.error('Please select employee and month');
            return;
        }
        setSaving(true);
        try {
            const emp = employees.find((e) => e.id === form.employeeId);
            await addDoc(collection(db, 'salaryHistory'), {
                employeeId: form.employeeId,
                employeeName: emp?.fullName || '',
                salaryMonth: form.salaryMonth,
                baseSalary: calculatedSalary.baseSalary,
                presentDays: calculatedSalary.presentDays,
                absentDays: calculatedSalary.absentDays,
                lateDays: calculatedSalary.lateDays,
                earnedSalary: calculatedSalary.earnedSalary,
                latePenalty: calculatedSalary.latePenalty,
                overtime: calculatedSalary.overtime,
                deductions: calculatedSalary.deductions,
                amountPaid: calculatedSalary.finalSalary,
                paymentDate: form.paymentDate,
                createdAt: new Date().toISOString(),
            });

            // Log activity
            try {
                await addDoc(collection(db, 'activityLogs'), {
                    action: `Salary ₹${calculatedSalary.finalSalary.toLocaleString()} paid to ${emp?.fullName} for ${form.salaryMonth}`,
                    module: 'Salary',
                    user: 'Admin',
                    createdAt: new Date().toISOString(),
                });
            } catch { /* not critical */ }

            toast.success('Salary payment recorded!');
            setShowForm(false);
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
        <AdminLayout title="Salary Management" subtitle="Attendance-based salary calculation">
            {/* Header */}
            <div className="admin-section-header fade-in">
                <div>
                    <h2 className="admin-section-title">{salaryHistory.length} Payment Records</h2>
                    <p style={{ fontSize: '0.85rem', color: '#adb5bd', marginTop: '4px' }}>
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
                    <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}>
                        Calculate & Record Salary
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Employee *</label>
                                <select className="form-select" value={form.employeeId}
                                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
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
                                    {MONTHS.map((m) => {
                                        const year = new Date().getFullYear();
                                        const val = `${m} ${year}`;
                                        return <option key={m} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Overtime Bonus (₹)</label>
                                <input type="number" className="form-input" value={form.overtime}
                                    onChange={(e) => setForm({ ...form, overtime: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deductions (₹)</label>
                                <input type="number" className="form-input" value={form.deductions}
                                    onChange={(e) => setForm({ ...form, deductions: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Date *</label>
                                <input type="date" className="form-input" value={form.paymentDate}
                                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                            </div>
                        </div>

                        {/* Salary Breakdown */}
                        {calculatedSalary && (
                            <div style={{ margin: '20px 0', padding: '16px', borderRadius: '12px', background: '#f8f9fa', border: '1px solid #f1f3f5' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#212529', fontFamily: 'Inter, sans-serif' }}>
                                    Salary Breakdown
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{calculatedSalary.presentDays}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Present Days</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>{calculatedSalary.absentDays}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Absent Days</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{calculatedSalary.lateDays}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Late Days</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#495057', fontFamily: 'Inter, sans-serif' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                        <span>Base Salary</span>
                                        <span>₹{calculatedSalary.baseSalary.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                        <span>Earned ({calculatedSalary.presentDays}/{WORKING_DAYS_PER_MONTH} days)</span>
                                        <span>₹{calculatedSalary.earnedSalary.toLocaleString()}</span>
                                    </div>
                                    {calculatedSalary.overtime > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                                            <span>+ Overtime</span>
                                            <span>₹{calculatedSalary.overtime.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {calculatedSalary.latePenalty > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626' }}>
                                            <span>− Late Penalty ({calculatedSalary.lateDays} × ₹{LATE_PENALTY_PER_DAY})</span>
                                            <span>₹{calculatedSalary.latePenalty.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {calculatedSalary.deductions > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626' }}>
                                            <span>− Deductions</span>
                                            <span>₹{calculatedSalary.deductions.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '6px', borderTop: '2px solid #dee2e6', fontWeight: 800, fontSize: '1rem', color: '#212529' }}>
                                        <span>Final Salary</span>
                                        <span style={{ color: '#f4a261' }}>₹{calculatedSalary.finalSalary.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving || !calculatedSalary}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> Pay ₹{calculatedSalary?.finalSalary?.toLocaleString() || 0}</>}
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
                                <th>Month</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Late</th>
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
                                    <td style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>{r.presentDays ?? '—'}</td>
                                    <td style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>{r.absentDays ?? '—'}</td>
                                    <td style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>{r.lateDays ?? '—'}</td>
                                    <td style={{ fontWeight: 700, color: '#4ade80', fontSize: '1rem' }}>
                                        ₹{r.amountPaid?.toLocaleString()}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: '#adb5bd' }}>{r.paymentDate}</td>
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
