import React, { useState, useEffect } from 'react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiSearch, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import FaceRegisterModal from './FaceRegisterModal';
import './Admin.css';

const JOB_ROLES = ['Painter', 'Helper', 'Office Staff'];
const STATUSES = ['Active', 'Inactive'];

const EMPTY_FORM = {
    fullName: '', phoneNumber: '', jobRole: 'Painter',
    monthlySalary: '', joiningDate: '', employmentStatus: 'Active',
};

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [registerFaceEmp, setRegisterFaceEmp] = useState(null); // employee to register face for

    useEffect(() => {
        let mounted = true;
        const fetchEmployees = async () => {
            try {
                // Safety timeout
                const timeoutId = setTimeout(() => {
                    if (mounted && loading) {
                        console.warn('Employees fetch timed out');
                        setLoading(false);
                    }
                }, 5000);

                const snapshot = await getDocs(collection(db, 'employees'));
                clearTimeout(timeoutId);

                if (!mounted) return;

                setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Fetch Employees Error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchEmployees();
        return () => { mounted = false; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.phoneNumber || !form.monthlySalary || !form.joiningDate) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            const data = {
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                jobRole: form.jobRole,
                monthlySalary: parseFloat(form.monthlySalary),
                joiningDate: form.joiningDate,
                employmentStatus: form.employmentStatus,
            };
            if (editId) {
                await updateDoc(doc(db, 'employees', editId), data);
                toast.success('Employee updated!');
            } else {
                await addDoc(collection(db, 'employees'), { ...data, createdAt: new Date().toISOString() });
                toast.success('Employee registered!');
            }
            resetForm();
            fetchEmployees();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save employee');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (emp) => {
        setForm({
            fullName: emp.fullName || '',
            phoneNumber: emp.phoneNumber || '',
            jobRole: emp.jobRole || 'Painter',
            monthlySalary: emp.monthlySalary || '',
            joiningDate: emp.joiningDate || '',
            employmentStatus: emp.employmentStatus || 'Active',
        });
        setEditId(emp.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (emp) => {
        if (!window.confirm(`Remove ${emp.fullName}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'employees', emp.id));
            toast.success('Employee removed');
            fetchEmployees();
        } catch {
            toast.error('Failed to delete employee');
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const filtered = employees.filter((e) => {
        const matchSearch = e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            e.phoneNumber?.includes(search);
        const matchRole = filterRole === 'All' || e.jobRole === filterRole;
        const matchStatus = filterStatus === 'All' || e.employmentStatus === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });

    return (
        <AdminLayout title="Employee Management" subtitle="Manage your workforce">
            {/* Header */}
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">{employees.length} Employees</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add Employee</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="admin-form-card fade-in">
                    <h3 style={{ marginBottom: '24px', color: '#f8f9fa', fontWeight: 700 }}>
                        {editId ? 'Edit Employee' : 'Register New Employee'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" placeholder="John Doe" value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input className="form-input" placeholder="+91 98765 43210" value={form.phoneNumber}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Job Role *</label>
                                <select className="form-select" value={form.jobRole}
                                    onChange={(e) => setForm({ ...form, jobRole: e.target.value })}>
                                    {JOB_ROLES.map((r) => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Monthly Salary (₹) *</label>
                                <input type="number" className="form-input" placeholder="25000" value={form.monthlySalary}
                                    onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Joining Date *</label>
                                <input type="date" className="form-input" value={form.joiningDate}
                                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Employment Status</label>
                                <select className="form-select" value={form.employmentStatus}
                                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}>
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> {editId ? 'Update' : 'Register'} Employee</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="emp-filters fade-in">
                <div className="search-box" style={{ maxWidth: '280px' }}>
                    <FiSearch size={16} className="search-icon" />
                    <input type="text" className="search-input" placeholder="Search employees..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 'auto', minWidth: '140px' }}
                    value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="All">All Roles</option>
                    {JOB_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <select className="form-select" style={{ width: 'auto', minWidth: '140px' }}
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No employees found</h3>
                    <p>Add your first employee to get started</p>
                </div>
            ) : (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Salary</th>
                                <th>Joining Date</th>
                                <th>Status</th>
                                <th>Face ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((emp) => (
                                <tr key={emp.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="emp-avatar">{emp.fullName?.[0]?.toUpperCase()}</div>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: 'rgba(248,249,250,0.65)' }}>{emp.phoneNumber}</td>
                                    <td><span className="badge badge-info">{emp.jobRole}</span></td>
                                    <td style={{ fontWeight: 600, color: '#f4a261' }}>₹{emp.monthlySalary?.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'rgba(248,249,250,0.5)' }}>{emp.joiningDate}</td>
                                    <td>
                                        <span className={`badge ${emp.employmentStatus === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                            {emp.employmentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        {emp.faceDescriptor?.length > 0 ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#00e676', fontWeight: 600 }}>
                                                ✅ Registered
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#ffd166', fontWeight: 600 }}>
                                                ⚠ Not Registered
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(emp)} title="Edit">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm face-reg-btn"
                                                onClick={() => setRegisterFaceEmp(emp)}
                                                title={emp.faceDescriptor ? 'Re-register Face' : 'Register Face'}
                                                style={{ color: emp.faceDescriptor ? '#00e676' : '#ffd166' }}
                                            >
                                                <FiCamera size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp)} title="Delete">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Face Registration Modal */}
            {registerFaceEmp && (
                <FaceRegisterModal
                    employee={registerFaceEmp}
                    onClose={() => setRegisterFaceEmp(null)}
                    onSuccess={() => {
                        setRegisterFaceEmp(null);
                        fetchEmployees();
                    }}
                />
            )}
        </AdminLayout>
    );
};

export default EmployeeManagement;
