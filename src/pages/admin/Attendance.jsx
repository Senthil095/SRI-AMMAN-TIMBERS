import React, { useState, useEffect } from 'react';
import {
    collection, getDocs, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, isAfter, isSunday } from 'date-fns';
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

    useEffect(() => {
        const fetchEmployees = async () => {
            const snap = await getDocs(query(collection(db, 'employees'), orderBy('fullName')));
            const emps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setEmployees(emps);
            setSelectedEmployee('ALL'); // Default to summary view
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
            timeoutId = setTimeout(() => {
                console.warn('Attendance fetch timed out');
                setLoading(false);
            }, 5000);

            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            let constraints = [
                where('date', '>=', start),
                where('date', '<=', end)
            ];
            
            if (selectedEmployee !== 'ALL') {
                constraints.push(where('employeeId', '==', selectedEmployee));
            }

            const q = query(
                collection(db, 'attendanceRecords'),
                ...constraints
            );
            const snap = await getDocs(q);
            setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            clearTimeout(timeoutId);
        } catch (err) {
            console.error("Fetch Attendance Error:", err);
            clearTimeout(timeoutId);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return attendanceRecords.find((r) => r.date === dateStr);
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    // Calculate real "Expected Working Days" up to today (excluding Sundays)
    const today = new Date();
    const pastWorkingDays = days.filter(d => 
        !isAfter(d, today) && !isSunday(d) && d.getMonth() === currentMonth.getMonth()
    );

    const expectedDaysCount = pastWorkingDays.length;

    // --- Stats for Selected Individual Employee ---
    const getRealAbsentCount = (records) => {
        // Count how many of the expected past working days have NO present/late/half-day record
        return pastWorkingDays.filter(d => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const hasRecord = records.find(r => r.date === dateStr && r.attendanceStatus !== 'Absent');
            return !hasRecord;
        }).length;
    };

    const presentCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Present').length;
    const lateCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Late').length;
    const halfDayCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Half Day').length;
    
    // Explicit absent marks + inferred absent days
    const explicitAbsentCount = attendanceRecords.filter((r) => r.attendanceStatus === 'Absent').length;
    const inferredAbsentCount = getRealAbsentCount(attendanceRecords);
    const totalAbsentCount = Math.max(explicitAbsentCount, inferredAbsentCount);

    const selectedEmp = employees.find((e) => e.id === selectedEmployee);

    // --- Summaries for ALL Employees View ---
    const employeeSummaries = employees.map(emp => {
        const empRecords = attendanceRecords.filter(r => r.employeeId === emp.id);
        const ePresent = empRecords.filter(r => r.attendanceStatus === 'Present').length;
        const eLate = empRecords.filter(r => r.attendanceStatus === 'Late').length;
        const eHalfDay = empRecords.filter(r => r.attendanceStatus === 'Half Day').length;
        const eExplicitAbsent = empRecords.filter(r => r.attendanceStatus === 'Absent').length;
        const eInferredAbsent = getRealAbsentCount(empRecords);

        return {
            ...emp,
            present: ePresent,
            late: eLate,
            halfDay: eHalfDay,
            absent: Math.max(eExplicitAbsent, eInferredAbsent),
            total: ePresent + eLate + eHalfDay
        };
    });

    const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

    return (
        <AdminLayout title="Attendance" subtitle="Face Scan Check-In & Reports">
            
            {/* ── Face Scan Section ─────────────────── */}
            <div className="admin-form-card fade-in" style={{ marginBottom: '30px' }}>
                <FaceScanAttendance onAttendanceMarked={fetchAttendance} />
            </div>

            {/* ── Reports Section ────────────────────── */}
            <div className="admin-section-header fade-in">
                <h2 className="admin-section-title">Attendance Reports</h2>
                <p className="admin-section-subtitle">View monthly attendance history for each employee</p>
            </div>

            <div className="attendance-controls fade-in">
                <div className="form-group" style={{ minWidth: '240px' }}>
                    <label className="form-label">View Mode</label>
                    <select className="form-select" value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}>
                        <option value="ALL" style={{ fontWeight: 'bold' }}>Company Summary (All Employees)</option>
                        <optgroup label="Individual Employee Records">
                            {employees.map((e) => (
                                <option key={e.id} value={e.id}>{e.fullName} — {e.jobRole}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {selectedEmp && selectedEmployee !== 'ALL' && (
                    <div className="attendance-stats">
                        <div className="att-stat present">
                            <span className="att-stat-num">{presentCount}</span>
                            <span className="att-stat-label">Present</span>
                        </div>
                        <div className="att-stat halfday">
                            <span className="att-stat-num">{halfDayCount}</span>
                            <span className="att-stat-label">Half Day</span>
                        </div>
                        <div className="att-stat late">
                            <span className="att-stat-num">{lateCount}</span>
                            <span className="att-stat-label">Late</span>
                        </div>
                        <div className="att-stat absent">
                            <span className="att-stat-num">{totalAbsentCount}</span>
                            <span className="att-stat-label">Absent</span>
                        </div>
                        <div className="att-stat total">
                            <span className="att-stat-num">{presentCount + lateCount + halfDayCount}</span>
                            <span className="att-stat-label">Total Days Worked</span>
                        </div>
                    </div>
                )}
            </div>

            {selectedEmployee === 'ALL' ? (
                /* All Employees Summary Table */
                <div className="admin-form-card fade-in">
                    <div className="calendar-header">
                        <button className="btn btn-ghost btn-sm" onClick={prevMonth}>‹ Prev</button>
                        <h3 className="calendar-month">Company Summary — {format(currentMonth, 'MMMM yyyy')}</h3>
                        <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next ›</button>
                    </div>
                    {loading ? (
                        <div className="loading-center" style={{ minHeight: '200px' }}>
                            <div className="spinner" />
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee Name</th>
                                        <th>Role</th>
                                        <th>Total Present</th>
                                        <th>Late Entries</th>
                                        <th>Half Days</th>
                                        <th>Total Absent</th>
                                        <th>Active Days Logged</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeSummaries.map((emp) => (
                                        <tr key={emp.id}>
                                            <td style={{ fontWeight: 600 }}>{emp.fullName}</td>
                                            <td style={{ fontSize: '0.875rem', color: 'rgba(248,249,250,0.5)' }}>{emp.jobRole}</td>
                                            <td style={{ color: '#00e676', fontWeight: 'bold' }}>{emp.present}</td>
                                            <td style={{ color: '#ffd166', fontWeight: 'bold' }}>{emp.late}</td>
                                            <td style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{emp.halfDay}</td>
                                            <td style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{emp.absent}</td>
                                            <td style={{ color: '#64b4ff' }}>{emp.total} days</td>
                                        </tr>
                                    ))}
                                    {employeeSummaries.length === 0 && (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', opacity: 0.5 }}>No employees found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Calendar View (Read-Only) */}
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
                                    className={`calendar-day ${record ? record.attendanceStatus.toLowerCase().replace(' ', '-') : ''} ${today ? 'today' : ''}`}
                                    style={{ cursor: 'default' }}
                                >
                                    <span className="day-number">{format(day, 'd')}</span>
                                    {record ? (
                                        <span className="day-status">
                                            {record.attendanceStatus === 'Present' ? '✓' : 
                                             record.attendanceStatus === 'Late' ? '⚠' : 
                                             record.attendanceStatus === 'Half Day' ? '½' : '✗'}
                                        </span>
                                    ) : (
                                        <span className="day-status" style={{ opacity: 0.1 }}>-</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="calendar-legend">
                    <div className="legend-item"><div className="legend-dot present" /> Present</div>
                    <div className="legend-item"><div className="legend-dot late" style={{ background: '#ffa500' }} /> Late</div>
                    <div className="legend-item"><div className="legend-dot" style={{ background: '#8b5cf6' }} /> Half Day</div>
                    <div className="legend-item"><div className="legend-dot absent" /> Absent</div>
                    <div className="legend-item"><div className="legend-dot today" /> Today</div>
                </div>
            </div>

            {/* History Table */}
            {attendanceRecords.length > 0 && (
                <div className="admin-form-card fade-in">
                    <h3 className="admin-section-title" style={{ marginBottom: '20px' }}>
                        Detailed Logs — {format(currentMonth, 'MMMM yyyy')}
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
                                                <span className={`badge ${
                                                    r.attendanceStatus === 'Present' ? 'badge-success' :
                                                    r.attendanceStatus === 'Late' ? 'badge-warning' :
                                                    r.attendanceStatus === 'Half Day' ? 'badge-purple' :
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
