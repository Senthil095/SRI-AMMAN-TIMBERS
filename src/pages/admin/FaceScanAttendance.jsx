import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCamera, FiLoader, FiUser, FiCheck, FiClock, FiLogIn, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import './FaceScanAttendance.css';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const SHIFT_START_HOUR = 9;  // 9:00 AM — late if check-in is after this
const SHIFT_START_MINUTE = 0;

const FaceScanAttendance = ({ onAttendanceMarked }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelError, setModelError] = useState(false);
    const [modelProgress, setModelProgress] = useState('Initializing…');
    const [cameraActive, setCameraActive] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [faceMatcher, setFaceMatcher] = useState(null);
    const [recognizedEmp, setRecognizedEmp] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null); // existing record for recognized emp today
    const [marking, setMarking] = useState(false);
    const [lastAction, setLastAction] = useState(null); // { name, action, time }
    const [registeredCount, setRegisteredCount] = useState(0);

    // Load face-api.js models
    useEffect(() => {
        const load = async () => {
            try {
                setModelProgress('Loading face detector…');
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                setModelProgress('Loading face landmarks…');
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                setModelProgress('Loading recognition model…');
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setModelsLoaded(true);
                setModelProgress('Ready');
            } catch (err) {
                console.error('face-api model load error:', err);
                setModelError(true);
            }
        };
        load();
        return () => stopCamera();
    }, []);

    // Load registered employees and build FaceMatcher
    const loadEmployees = useCallback(async () => {
        try {
            const snap = await getDocs(collection(db, 'employees'));
            const emps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEmployees(emps);
            const registered = emps.filter(e => e.faceDescriptor?.length > 0);
            setRegisteredCount(registered.length);
            if (registered.length > 0) {
                const labeledDescriptors = registered.map(e =>
                    new faceapi.LabeledFaceDescriptors(
                        e.id,
                        [new Float32Array(e.faceDescriptor)]
                    )
                );
                setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.5));
            } else {
                setFaceMatcher(null);
            }
        } catch (err) {
            console.error('Failed to load employees:', err);
        }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    // Fetch today's attendance record for currently recognized employee
    const fetchTodayRecord = useCallback(async (employeeId) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const q = query(
            collection(db, 'attendanceRecords'),
            where('employeeId', '==', employeeId),
            where('date', '==', today)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { docId: snap.docs[0].id, ...snap.docs[0].data() };
        }
        return null;
    }, []);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch {
            toast.error('Camera access denied. Please allow camera permission.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
        setRecognizedEmp(null);
        setTodayRecord(null);
    }, []);

    // Live recognition loop
    useEffect(() => {
        if (!cameraActive || !modelsLoaded || !faceMatcher) return;

        intervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            const dims = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, dims);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detection) {
                const resized = faceapi.resizeResults(detection, dims);
                const match = faceMatcher.findBestMatch(detection.descriptor);
                const emp = employees.find(e => e.id === match.label);

                if (match.label !== 'unknown' && emp) {
                    // Draw green bounding box
                    const box = resized.detection.box;
                    ctx.strokeStyle = '#00e676';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#00e676';
                    ctx.shadowBlur = 15;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                    // Name label above box
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(0, 230, 118, 0.9)';
                    ctx.fillRect(box.x, box.y - 30, box.width, 30);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 14px Inter, sans-serif';
                    ctx.fillText(emp.fullName, box.x + 6, box.y - 10);

                    // Update recognized employee state and fetch their today record
                    setRecognizedEmp(prev => {
                        if (prev?.id !== emp.id) {
                            fetchTodayRecord(emp.id).then(rec => setTodayRecord(rec));
                        }
                        return emp;
                    });
                } else {
                    // Unknown face
                    const box = resized.detection.box;
                    ctx.strokeStyle = '#ff9800';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ff9800';
                    ctx.shadowBlur = 8;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255, 152, 0, 0.85)';
                    ctx.fillRect(box.x, box.y - 26, box.width, 26);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 13px Inter, sans-serif';
                    ctx.fillText('Unknown Employee', box.x + 6, box.y - 8);
                    setRecognizedEmp(null);
                    setTodayRecord(null);
                }
            } else {
                setRecognizedEmp(null);
                setTodayRecord(null);
            }
        }, 350);

        return () => clearInterval(intervalRef.current);
    }, [cameraActive, modelsLoaded, faceMatcher, employees, fetchTodayRecord]);

    // Determine if this is check-in or check-out
    const getAction = () => {
        if (!todayRecord) return 'checkin';
        if (todayRecord.inTime && !todayRecord.outTime) return 'checkout';
        return 'done'; // Both in and out already done
    };

    const getStatusForCheckin = (nowDate) => {
        const shiftStart = new Date(nowDate);
        shiftStart.setHours(SHIFT_START_HOUR, SHIFT_START_MINUTE, 0, 0);
        return nowDate > shiftStart ? 'Late' : 'Present';
    };

    const markAttendance = async () => {
        if (!recognizedEmp) return;
        const action = getAction();
        if (action === 'done') {
            toast.error(`${recognizedEmp.fullName} has already checked in and out today.`);
            return;
        }

        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const timeStr = format(now, 'hh:mm:ss a');

        setMarking(true);
        try {
            if (action === 'checkin') {
                const status = getStatusForCheckin(now);
                await addDoc(collection(db, 'attendanceRecords'), {
                    employeeId: recognizedEmp.id,
                    employeeName: recognizedEmp.fullName,
                    date: today,
                    inTime: timeStr,
                    outTime: null,
                    attendanceStatus: status,
                    method: 'face_recognition',
                    markedAt: now.toISOString(),
                });
                const msg = status === 'Late'
                    ? `⚠ ${recognizedEmp.fullName} — Check-In Recorded (LATE at ${timeStr})`
                    : `✅ ${recognizedEmp.fullName} — Check-In at ${timeStr}`;
                toast.success(msg, { duration: 4000 });
                setLastAction({ name: recognizedEmp.fullName, action: 'Check-In', time: timeStr, status });
            } else {
                // Check-out — update existing record
                await updateDoc(doc(db, 'attendanceRecords', todayRecord.docId), {
                    outTime: timeStr,
                });
                toast.success(`👋 ${recognizedEmp.fullName} — Check-Out at ${timeStr}`, { duration: 4000 });
                setLastAction({ name: recognizedEmp.fullName, action: 'Check-Out', time: timeStr, status: todayRecord.attendanceStatus });
            }
            setRecognizedEmp(null);
            setTodayRecord(null);
            onAttendanceMarked?.();
            setTimeout(() => setLastAction(null), 5000);
        } catch (err) {
            console.error(err);
            toast.error('Failed to record attendance. Try again.');
        } finally {
            setMarking(false);
        }
    };

    const action = getAction();
    const actionLabel = action === 'checkout' ? 'Check-Out' : 'Check-In';
    const ActionIcon = action === 'checkout' ? FiLogOut : FiLogIn;

    return (
        <div className="face-scan-container">
            {/* Top info bar */}
            <div className="face-scan-topbar">
                <div className="face-scan-stat">
                    <FiUser size={14} />
                    <span>{registeredCount} faces registered</span>
                </div>
                <div className="face-scan-clock">
                    <FiClock size={14} />
                    <span>{format(new Date(), 'hh:mm a, dd MMM yyyy')} · Shift starts {SHIFT_START_HOUR}:00 AM</span>
                </div>
            </div>

            {registeredCount === 0 && (
                <div className="face-scan-warning">
                    <FiAlertCircle size={14} />
                    No faces registered yet. Go to Employee Management → click the 📷 camera icon to register faces.
                </div>
            )}

            {/* Camera Viewport */}
            <div className="face-scan-viewport">
                <video ref={videoRef} className="face-scan-video" muted playsInline />
                <canvas ref={canvasRef} className="face-scan-canvas" />

                {!cameraActive && (
                    <div className="face-scan-placeholder">
                        <div className="face-scan-icon">📷</div>
                        <p>Click "Start Camera" to begin face scanning</p>
                    </div>
                )}

                {/* Scan line */}
                {cameraActive && <div className="scan-line-overlay"><div className="scan-line-anim" /></div>}

                {/* Status badge in camera */}
                {cameraActive && !recognizedEmp && (
                    <div className="face-scan-badge searching">
                        <span className="face-dot" />
                        Scanning for registered faces…
                    </div>
                )}

                {recognizedEmp && (
                    <div className={`face-scan-badge recognized ${action === 'checkout' ? 'checkout' : action === 'done' ? 'done' : ''}`}>
                        {action === 'done'
                            ? `✅ ${recognizedEmp.fullName} — Already Checked In & Out`
                            : `${action === 'checkout' ? '👋' : '👋'} ${recognizedEmp.fullName} — Ready to ${actionLabel}`
                        }
                    </div>
                )}

                {/* Last action success overlay */}
                {lastAction && (
                    <div className={`face-marked-overlay ${lastAction.action === 'Check-Out' ? 'checkout' : lastAction.status === 'Late' ? 'late' : ''}`}>
                        <div className="face-marked-icon">
                            {lastAction.action === 'Check-Out' ? <FiLogOut size={36} /> : <FiLogIn size={36} />}
                        </div>
                        <p className="face-marked-name">{lastAction.name}</p>
                        <p className="face-marked-action">{lastAction.action} — {lastAction.time}</p>
                        {lastAction.status === 'Late' && <span className="face-marked-late">⚠ LATE ENTRY</span>}
                    </div>
                )}
            </div>

            {/* Right side: Recognized employee card */}
            {recognizedEmp && action !== 'done' && (
                <div className="face-recog-card">
                    <div className="face-recog-avatar">{recognizedEmp.fullName?.[0]?.toUpperCase()}</div>
                    <div className="face-recog-info">
                        <h4>{recognizedEmp.fullName}</h4>
                        <span>{recognizedEmp.jobRole}</span>
                        {todayRecord?.inTime && (
                            <div className="face-recog-record">
                                <FiLogIn size={12} /> In: {todayRecord.inTime}
                            </div>
                        )}
                    </div>
                    <div className={`face-recog-action-label ${action}`}>
                        <ActionIcon size={14} /> {actionLabel}
                    </div>
                </div>
            )}

            {/* Model loading */}
            {!modelsLoaded && !modelError && (
                <div className="face-scan-loading">
                    <span className="spin-icon"><FiLoader size={14} /></span>
                    {modelProgress} (first time only — models downloading…)
                </div>
            )}
            {modelError && (
                <div className="face-scan-error">
                    ⚠ Failed to load recognition models. Check your internet connection and refresh.
                </div>
            )}

            {/* Action buttons */}
            <div className="face-scan-actions">
                {!cameraActive ? (
                    <button
                        className="btn btn-primary"
                        onClick={startCamera}
                        disabled={!modelsLoaded || modelError || registeredCount === 0}
                    >
                        <FiCamera size={16} /> Start Camera
                    </button>
                ) : (
                    <>
                        <button
                            className={`btn ${action === 'checkout' ? 'btn-warning' : 'btn-primary'} face-action-btn`}
                            onClick={markAttendance}
                            disabled={!recognizedEmp || marking || action === 'done'}
                        >
                            {marking
                                ? <span className="btn-spinner" />
                                : <><ActionIcon size={16} /> Mark {actionLabel}</>
                            }
                        </button>
                        <button className="btn btn-ghost" onClick={stopCamera}>Stop Camera</button>
                    </>
                )}
            </div>

            {/* Help text */}
            {cameraActive && (
                <div className="face-scan-help">
                    <strong>How it works:</strong> Stand in front of the camera. When your face is recognized, click <em>Mark Check-In</em> (morning) or <em>Mark Check-Out</em> (evening). If you arrive after {SHIFT_START_HOUR}:00 AM, your entry is marked <em>Late</em>.
                </div>
            )}
        </div>
    );
};

export default FaceScanAttendance;
