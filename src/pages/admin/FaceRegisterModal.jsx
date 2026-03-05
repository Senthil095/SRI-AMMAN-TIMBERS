import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { FiX, FiCamera, FiCheck, FiLoader } from 'react-icons/fi';
import './FaceRegisterModal.css';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

const FaceRegisterModal = ({ employee, onClose, onSuccess }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelError, setModelError] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState('idle'); // idle | detecting | detected | captured
    const [capturedDescriptor, setCapturedDescriptor] = useState(null);
    const [saving, setSaving] = useState(false);

    // Load models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error('Failed to load face-api models:', err);
                setModelError(true);
            }
        };
        loadModels();
        return () => stopCamera();
    }, []);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);
            setDetectionStatus('detecting');
        } catch (err) {
            toast.error('Could not access camera. Please allow camera permission.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Live detection loop
    useEffect(() => {
        if (!cameraActive || !modelsLoaded || capturedDescriptor) return;

        intervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            const canvas = canvasRef.current;
            const video = videoRef.current;

            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            const dims = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, dims);

            if (detection) {
                const resized = faceapi.resizeResults(detection, dims);
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw green box around face
                const box = resized.detection.box;
                ctx.strokeStyle = '#00e676';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00e676';
                ctx.shadowBlur = 10;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                // Landmarks
                faceapi.draw.drawFaceLandmarks(canvas, resized);
                setDetectionStatus('detected');
            } else {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setDetectionStatus('detecting');
            }
        }, 200);

        return () => clearInterval(intervalRef.current);
    }, [cameraActive, modelsLoaded, capturedDescriptor]);

    const captureFace = async () => {
        if (!videoRef.current || detectionStatus !== 'detected') return;

        const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            toast.error('No face detected. Please look at the camera.');
            return;
        }

        const descriptor = Array.from(detection.descriptor);
        setCapturedDescriptor(descriptor);
        setDetectionStatus('captured');
        stopCamera();
        toast.success('Face captured! Click Save to register.');
    };

    const saveFace = async () => {
        if (!capturedDescriptor) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'employees', employee.id), {
                faceDescriptor: capturedDescriptor,
            });
            toast.success(`Face registered for ${employee.fullName}!`);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save face data. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const retake = () => {
        setCapturedDescriptor(null);
        setDetectionStatus('idle');
        if (canvasRef.current) {
            canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        startCamera();
    };

    return (
        <div className="face-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="face-modal">
                {/* Header */}
                <div className="face-modal-header">
                    <div>
                        <h2 className="face-modal-title">Register Face</h2>
                        <p className="face-modal-subtitle">{employee.fullName} — {employee.jobRole}</p>
                    </div>
                    <button className="face-modal-close" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                {/* Camera viewport */}
                <div className="face-viewport">
                    <video ref={videoRef} className="face-video" muted playsInline />
                    <canvas ref={canvasRef} className="face-canvas" />

                    {!cameraActive && !capturedDescriptor && (
                        <div className="face-placeholder">
                            <div className="face-icon-ring">👤</div>
                            <p>Camera not started</p>
                        </div>
                    )}

                    {detectionStatus === 'detecting' && cameraActive && (
                        <div className="face-scan-overlay">
                            <div className="scan-line" />
                        </div>
                    )}

                    {/* Status badge */}
                    {cameraActive && (
                        <div className={`face-status-badge ${detectionStatus}`}>
                            {detectionStatus === 'detecting' ? '🔍 Looking for face...' : '✅ Face detected — Click Capture'}
                        </div>
                    )}

                    {capturedDescriptor && (
                        <div className="face-captured-overlay">
                            <FiCheck size={48} />
                            <p>Face Captured!</p>
                        </div>
                    )}
                </div>

                {/* Model loading */}
                {!modelsLoaded && !modelError && (
                    <div className="face-loading-bar">
                        <span className="spin-icon"><FiLoader size={14} /></span>
                        Loading face recognition models… (first time only)
                    </div>
                )}
                {modelError && (
                    <div className="face-error-bar">⚠ Failed to load models. Check your internet connection.</div>
                )}

                {/* Actions */}
                <div className="face-modal-actions">
                    {!cameraActive && !capturedDescriptor && (
                        <button
                            className="btn btn-primary"
                            onClick={startCamera}
                            disabled={!modelsLoaded || modelError}
                        >
                            <FiCamera size={16} /> Start Camera
                        </button>
                    )}

                    {cameraActive && !capturedDescriptor && (
                        <button
                            className="btn btn-primary"
                            onClick={captureFace}
                            disabled={detectionStatus !== 'detected'}
                        >
                            <FiCamera size={16} /> Capture Face
                        </button>
                    )}

                    {capturedDescriptor && (
                        <>
                            <button className="btn btn-ghost" onClick={retake}>Retake</button>
                            <button
                                className="btn btn-primary"
                                onClick={saveFace}
                                disabled={saving}
                            >
                                {saving ? <span className="btn-spinner" /> : <><FiCheck size={16} /> Save Face</>}
                            </button>
                        </>
                    )}

                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default FaceRegisterModal;
