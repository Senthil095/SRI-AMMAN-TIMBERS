import React, { useState, useEffect } from 'react';
import {
    collection, getDocs, addDoc, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiCalendar, FiCheck, FiX, FiCamera } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import FaceScanAttendance from './FaceScanAttendance';
import './Admin.css';
import './Attendance.css';
import './FaceScanAttendance.css';

const Attendance = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [mode, setMode] = useState('manual'); // 'manual' | 'face'

    useEffect(() => {
        const fetchEmployees = async () => {
            const snap = await getDocs(query(collection(db, 'employees'), orderBy('fullName')));
            const emps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setEmployees(emps);
            if (emps.length > 0) setSelectedEmployee(emps[0].id);
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!selectedEmployee) return;
        fetchAttendance();
    }, [selectedEmployee, currentMonth]);

    const fetchAttendance = async () => {
        setLoading(true);
        let timeoutId;
        try {
            // Safety timeout
            timeoutId = setTimeout(() => {
                console.warn('Attendance fetch timed out');
                setLoading(false); // Ensure loading state is reset
            }, 5000); // 5 seconds timeout

            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            const q = query(
                collection(db, 'attendanceRecords'),
                where('employeeId', '==', selectedEmployee),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const snap = await getDocs(q);
            setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            clearTimeout(timeoutId); // Clear timeout if fetch completes successfully
        } catch (err) {
            console.error("Fetch Attendance Error:", err); // More specific error message
            clearTimeout(timeoutId); // Clear timeout if fetch fails
        } finally {
            setLoading(false); // Ensure loading state is reset
        }
    };

    const getAttendanceForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return attendanceRecords.find((r) => r.date === dateStr);
    };

    const markAttendance = async (date, status) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = getAttendanceForDate(date);
        if (existing) {
            toast.error('Attendance already marked for this date');
            return;
        }
        setMarking(true);
        try {
            await addDoc(collection(db, 'attendanceRecords'), {
                employeeId: selectedEmployee,
                date: dateStr,
                attendanceStatus: status,
                markedAt: new Date().toISOString(),
            });
            toast.success(`Marked as ${status}`);
            fetchAttendance();
        } catch (err) {
            toast.error('Failed to mark attendance');
        } finally {
            setMarking(false);
        }
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const presentCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Present').length;
    const absentCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Absent').length;
    const lateCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Late').length;

    const selectedEmp = employees.find((e) => e.id === selectedEmployee);

    const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

    return (
        <AdminLayout title="Attendance" subtitle="Mark and track daily attendance">
            {/* Tab Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="fade-in">
                <div className="attendance-tab-toggle">
                    <button
                        className={`att-tab-btn ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                    >
                        <FiCalendar size={14} /> Manual
                    </button>
                    <button
                        className={`att-tab-btn ${mode === 'face' ? 'active' : ''}`}
                        onClick={() => setMode('face')}
                    >
                        <FiCamera size={14} /> Face Scan
                    </button>
                </div>
            </div>

            {/* ── Face Scan Mode ─────────────────── */}
            {mode === 'face' && (
                <div className="admin-form-card fade-in">
                    <FaceScanAttendance onAttendanceMarked={fetchAttendance} />
                </div>
            )}

            {/* ── Manual Mode ────────────────────── */}
            {mode === 'manual' && (
                <>
                    <div className="attendance-controls fade-in">
                        <div className="form-group" style={{ minWidth: '240px' }}>
                            <label className="form-label">Select Employee</label>
                            <select className="form-select" value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.fullName} — {e.jobRole}</option>
                                ))}
                            </select>
                        </div>

                        {selectedEmp && (
                            <div className="attendance-stats">
                                <div className="att-stat present">
                                    <span className="att-stat-num">{presentCount}</span>
                                    <span className="att-stat-label">Present</span>
                                </div>
                                <div className="att-stat absent">
                                    <span className="att-stat-num">{absentCount}</span>
                                    <span className="att-stat-label">Absent</span>
                                </div>
                                <div className="att-stat late">
                                    <span className="att-stat-num">{lateCount}</span>
                                    <span className="att-stat-label">Late</span>
                                </div>
                                <div className="att-stat total">
                                    <span className="att-stat-num">{attendanceRecords.length}</span>
                                    <span className="att-stat-label">Marked</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Calendar */}
                    <div className="admin-form-card fade-in">
                        <div className="calendar-header">
                            <button className="btn btn-ghost btn-sm" onClick={prevMonth}>‹ Prev</button>
                            <h3 className="calendar-month">{format(currentMonth, 'MMMM yyyy')}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next ›</button>
                        </div>

                        <div className="calendar-weekdays">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} className="weekday-label">{d}</div>
                            ))}
                        </div>

                        {loading ? (
                            <div className="loading-center" style={{ minHeight: '200px' }}>
                                <div className="spinner" />
                            </div>
                        ) : (
                            <div className="calendar-grid">
                                {Array(days[0].getDay()).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} className="calendar-day empty" />
                                ))}
                                {days.map((day) => {
                                    const record = getAttendanceForDate(day);
                                    const today = isToday(day);
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`calendar-day ${record ? record.attendanceStatus.toLowerCase() : ''} ${today ? 'today' : ''}`}
                                        >
                                            <span className="day-number">{format(day, 'd')}</span>
                                            {record ? (
                                                <span className="day-status">
                                                    {record.attendanceStatus === 'Present' ? '✓' : '✗'}
                                                </span>
                                            ) : (
                                                <div className="day-actions">
                                                    <button
                                                        className="day-btn present-btn"
                                                        onClick={() => markAttendance(day, 'Present')}
                                                        disabled={marking}
                                                        title="Mark Present"
                                                    >
                                                        <FiCheck size={10} />
                                                    </button>
                                                    <button
                                                        className="day-btn absent-btn"
                                                        onClick={() => markAttendance(day, 'Absent')}
                                                        disabled={marking}
                                                        title="Mark Absent"
                                                    >
                                                        <FiX size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="calendar-legend">
                            <div className="legend-item"><div className="legend-dot present" /> Present</div>
                            <div className="legend-item"><div className="legend-dot absent" /> Absent</div>
                            <div className="legend-item"><div className="legend-dot today" /> Today</div>
                        </div>
                    </div>

                    {/* History Table */}
                    {attendanceRecords.length > 0 && (
                        <div className="admin-form-card fade-in">
                            <h3 className="admin-section-title" style={{ marginBottom: '20px' }}>
                                Attendance Report — {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Day</th>
                                            <th>In Time</th>
                                            <th>Out Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...attendanceRecords]
                                            .sort((a, b) => a.date.localeCompare(b.date))
                                            .map((r) => (
                                                <tr key={r.id}>
                                                    <td style={{ fontSize: '0.875rem' }}>{r.date}</td>
                                                    <td style={{ fontSize: '0.875rem', color: 'rgba(248,249,250,0.5)' }}>
                                                        {format(new Date(r.date + 'T00:00:00'), 'EEEE')}
                                                    </td>
                                                    <td style={{ fontSize: '0.82rem', color: '#00e676', fontWeight: 600 }}>
                                                        {r.inTime || '—'}
                                                    </td>
                                                    <td style={{ fontSize: '0.82rem', color: '#64b4ff', fontWeight: 600 }}>
                                                        {r.outTime || '—'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${r.attendanceStatus === 'Present' ? 'badge-success' :
                                                                r.attendanceStatus === 'Late' ? 'badge-warning' :
                                                                    'badge-danger'
                                                            }`}>
                                                            {r.attendanceStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
};

export default Attendance;

