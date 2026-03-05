import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiUpload, FiDownload, FiRefreshCw, FiHeart, FiClock, FiSliders, FiZoomIn, FiZoomOut, FiEye, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PaintPreview.css';

// ── Brand Paint Colors ──────────────────────────────────────
const BRAND_COLORS = [
    { name: 'Coral Bliss', hex: '#FF6B6B', brand: 'PaintPro' },
    { name: 'Ocean Teal', hex: '#2EC4B6', brand: 'PaintPro' },
    { name: 'Sky Dream', hex: '#4CC9F0', brand: 'PaintPro' },
    { name: 'Sunny Gold', hex: '#FFD166', brand: 'PaintPro' },
    { name: 'Lavender Mist', hex: '#C3B1E1', brand: 'PaintPro' },
    { name: 'Sage Green', hex: '#87C38F', brand: 'PaintPro' },
    { name: 'Dusty Rose', hex: '#E8A0BF', brand: 'PaintPro' },
    { name: 'Slate Blue', hex: '#6B8CAE', brand: 'PaintPro' },
    { name: 'Warm Ivory', hex: '#F5E6C8', brand: 'PaintPro' },
    { name: 'Charcoal', hex: '#4A4E69', brand: 'PaintPro' },
    { name: 'Mint Fresh', hex: '#A8DADC', brand: 'PaintPro' },
    { name: 'Terracotta', hex: '#C97B63', brand: 'PaintPro' },
    { name: 'Midnight Navy', hex: '#1B2A4A', brand: 'PaintPro' },
    { name: 'Peach Cream', hex: '#FFCBA4', brand: 'PaintPro' },
    { name: 'Forest Green', hex: '#3A7D44', brand: 'PaintPro' },
    { name: 'Blush Pink', hex: '#FFB5C8', brand: 'PaintPro' },
    { name: 'Steel Gray', hex: '#8D99AE', brand: 'PaintPro' },
    { name: 'Butter Yellow', hex: '#FFF3B0', brand: 'PaintPro' },
    { name: 'Deep Plum', hex: '#6D2B3D', brand: 'PaintPro' },
    { name: 'Arctic White', hex: '#F8F9FA', brand: 'PaintPro' },
    { name: 'Brick Red', hex: '#C1440E', brand: 'PaintPro' },
    { name: 'Aqua Marine', hex: '#7FFFD4', brand: 'PaintPro' },
    { name: 'Mocha Brown', hex: '#7B5E57', brand: 'PaintPro' },
    { name: 'Lemon Zest', hex: '#F9E04B', brand: 'PaintPro' },
];

const STEPS = ['Upload', 'Choose Color', 'Preview', 'Download'];

// Default blank wall (a simple gradient canvas)
const createDefaultWall = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    // Wall gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 500);
    grad.addColorStop(0, '#f5f0e8');
    grad.addColorStop(0.7, '#ede8df');
    grad.addColorStop(1, '#d8d0c4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);
    // Subtle texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 500; y += 8) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }
    // Floor line
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(0, 420, 800, 80);
    // Baseboard
    ctx.fillStyle = '#e8e0d4';
    ctx.fillRect(0, 415, 800, 12);
    return canvas.toDataURL('image/png');
};

const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

const PaintPreview = () => {
    const canvasRef = useRef(null);
    const origCanvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const animFrameRef = useRef(null);

    const [originalImage, setOriginalImage] = useState(null); // ImageData
    const [originalSrc, setOriginalSrc] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [selectedColor, setSelectedColor] = useState('#4CC9F0');
    const [customColor, setCustomColor] = useState('#4CC9F0');
    const [intensity, setIntensity] = useState(60);
    const [opacity, setOpacity] = useState(75);
    const [brightness, setBrightness] = useState(100);
    const [compareMode, setCompareMode] = useState(false);
    const [splitPos, setSplitPos] = useState(50);
    const [isDraggingSplit, setIsDraggingSplit] = useState(false);
    const [colorHistory, setColorHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [hoverColor, setHoverColor] = useState(null);
    const [colorApplied, setColorApplied] = useState(false);
    const [activeTab, setActiveTab] = useState('brand'); // 'brand' | 'custom'

    // Load default wall on mount
    useEffect(() => {
        const src = createDefaultWall();
        loadImageFromSrc(src);
    }, []);

    const loadImageFromSrc = (src) => {
        setIsProcessing(true);
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            const orig = origCanvasRef.current;
            if (!canvas || !orig) return;

            // Size canvases
            canvas.width = img.width;
            canvas.height = img.height;
            orig.width = img.width;
            orig.height = img.height;

            const ctx = canvas.getContext('2d');
            const octx = orig.getContext('2d');
            ctx.drawImage(img, 0, 0);
            octx.drawImage(img, 0, 0);

            setOriginalImage(ctx.getImageData(0, 0, img.width, img.height));
            setOriginalSrc(src);
            setColorApplied(false);
            setCompareMode(false);
            setActiveStep(1);
            setIsProcessing(false);
        };
        img.src = src;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => loadImageFromSrc(ev.target.result);
        reader.readAsDataURL(file);
        toast.success('Image uploaded!');
    };

    const applyColor = useCallback((colorHex = selectedColor) => {
        if (!originalImage || !canvasRef.current) return;
        setIsProcessing(true);
        setActiveStep(2);

        // Add to history
        const existing = colorHistory.find(c => c.hex === colorHex);
        if (!existing) {
            setColorHistory(prev => [{ hex: colorHex, name: BRAND_COLORS.find(c => c.hex === colorHex)?.name || colorHex }, ...prev].slice(0, 10));
        }

        // Use requestAnimationFrame to avoid blocking UI
        requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const { r: cr, g: cg, b: cb } = hexToRgb(colorHex);
            const bright = brightness / 100;
            const opac = opacity / 100;
            const intens = intensity / 100;

            // Copy original pixel data
            const imgData = new ImageData(
                new Uint8ClampedArray(originalImage.data),
                originalImage.width,
                originalImage.height
            );
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Luminance-based blending — preserves texture
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const blend = opac * intens;
                data[i] = Math.min(255, (r * (1 - blend) + cr * lum * blend * 2) * bright);
                data[i + 1] = Math.min(255, (g * (1 - blend) + cg * lum * blend * 2) * bright);
                data[i + 2] = Math.min(255, (b * (1 - blend) + cb * lum * blend * 2) * bright);
            }

            ctx.putImageData(imgData, 0, 0);
            setColorApplied(true);
            setIsProcessing(false);
            toast.success('Color applied!');
        });
    }, [originalImage, selectedColor, intensity, opacity, brightness, colorHistory]);

    const resetImage = () => {
        if (!originalImage || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.putImageData(originalImage, 0, 0);
        setColorApplied(false);
        setCompareMode(false);
        setActiveStep(1);
        toast('Reset to original', { icon: '↩️' });
    };

    const downloadImage = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `paintpro-preview-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
        setActiveStep(3);
        toast.success('Image downloaded!');
    };

    const toggleFavorite = (hex) => {
        setFavorites(prev =>
            prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
        );
    };

    // Split compare drag
    const handleSplitDrag = useCallback((e) => {
        if (!isDraggingSplit || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        setSplitPos(Math.max(5, Math.min(95, x)));
    }, [isDraggingSplit]);

    useEffect(() => {
        if (isDraggingSplit) {
            window.addEventListener('mousemove', handleSplitDrag);
            window.addEventListener('mouseup', () => setIsDraggingSplit(false));
        }
        return () => {
            window.removeEventListener('mousemove', handleSplitDrag);
            window.removeEventListener('mouseup', () => setIsDraggingSplit(false));
        };
    }, [isDraggingSplit, handleSplitDrag]);

    const selectAndApply = (hex) => {
        setSelectedColor(hex);
        setCustomColor(hex);
        applyColor(hex);
    };

    return (
        <div className="pp-page">
            {/* Header */}
            <div className="pp-header">
                <div className="container">
                    <div className="pp-header-content">
                        <div>
                            <h1 className="pp-title">🎨 Paint Preview</h1>
                            <p className="pp-subtitle">Visualize paint colors on your room before you buy</p>
                        </div>
                        {/* Step Indicator */}
                        <div className="pp-steps">
                            {STEPS.map((step, i) => (
                                <div key={step} className={`pp-step ${i <= activeStep ? 'active' : ''} ${i === activeStep ? 'current' : ''}`}>
                                    <div className="pp-step-dot">
                                        {i < activeStep ? <FiCheck size={12} /> : i + 1}
                                    </div>
                                    <span className="pp-step-label">{step}</span>
                                    {i < STEPS.length - 1 && <div className="pp-step-line" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="pp-layout">
                    {/* ── Left Panel: Controls ─────────────────────────── */}
                    <div className="pp-controls-panel">

                        {/* Upload Section */}
                        <div className="pp-card">
                            <h3 className="pp-card-title"><FiUpload size={16} /> Upload Image</h3>
                            <div className="pp-upload-area" onClick={() => fileInputRef.current?.click()}>
                                <div className="pp-upload-icon">📷</div>
                                <p className="pp-upload-text">Click to upload your room photo</p>
                                <p className="pp-upload-hint">JPG, PNG, WEBP supported</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <button
                                className="pp-btn pp-btn-ghost pp-btn-full"
                                onClick={() => { loadImageFromSrc(createDefaultWall()); toast('Using sample wall'); }}
                                style={{ marginTop: 10 }}
                            >
                                Use Sample Wall Instead
                            </button>
                        </div>

                        {/* Color Selection */}
                        <div className="pp-card">
                            <h3 className="pp-card-title">🎨 Choose Color</h3>
                            <div className="pp-tabs">
                                <button className={`pp-tab ${activeTab === 'brand' ? 'active' : ''}`} onClick={() => setActiveTab('brand')}>Brand Colors</button>
                                <button className={`pp-tab ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>Custom</button>
                                {favorites.length > 0 && (
                                    <button className={`pp-tab ${activeTab === 'fav' ? 'active' : ''}`} onClick={() => setActiveTab('fav')}>❤️ Saved</button>
                                )}
                            </div>

                            {activeTab === 'brand' && (
                                <div className="pp-color-grid">
                                    {BRAND_COLORS.map(c => (
                                        <div
                                            key={c.hex}
                                            className={`pp-color-swatch ${selectedColor === c.hex ? 'selected' : ''}`}
                                            style={{ background: c.hex }}
                                            title={c.name}
                                            onClick={() => { setSelectedColor(c.hex); setCustomColor(c.hex); }}
                                            onMouseEnter={() => setHoverColor(c)}
                                            onMouseLeave={() => setHoverColor(null)}
                                        >
                                            {selectedColor === c.hex && <FiCheck size={12} color="white" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'custom' && (
                                <div className="pp-custom-color">
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={e => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }}
                                        className="pp-color-picker-input"
                                    />
                                    <div className="pp-custom-preview" style={{ background: customColor }}>
                                        <span>{customColor.toUpperCase()}</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'fav' && (
                                <div className="pp-color-grid">
                                    {favorites.map(hex => (
                                        <div
                                            key={hex}
                                            className={`pp-color-swatch ${selectedColor === hex ? 'selected' : ''}`}
                                            style={{ background: hex }}
                                            onClick={() => { setSelectedColor(hex); setCustomColor(hex); }}
                                        >
                                            {selectedColor === hex && <FiCheck size={12} color="white" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hover preview */}
                            {hoverColor && (
                                <div className="pp-hover-preview">
                                    <div className="pp-hover-dot" style={{ background: hoverColor.hex }} />
                                    <span>{hoverColor.name}</span>
                                </div>
                            )}

                            {/* Selected color info */}
                            <div className="pp-selected-color">
                                <div className="pp-selected-dot" style={{ background: selectedColor }} />
                                <div>
                                    <div className="pp-selected-name">
                                        {BRAND_COLORS.find(c => c.hex === selectedColor)?.name || 'Custom Color'}
                                    </div>
                                    <div className="pp-selected-hex">{selectedColor.toUpperCase()}</div>
                                </div>
                                <button
                                    className={`pp-fav-btn ${favorites.includes(selectedColor) ? 'active' : ''}`}
                                    onClick={() => toggleFavorite(selectedColor)}
                                    title="Save to favorites"
                                >
                                    <FiHeart size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className="pp-card">
                            <h3 className="pp-card-title"><FiSliders size={16} /> Adjustments</h3>
                            <div className="pp-sliders">
                                <div className="pp-slider-group">
                                    <div className="pp-slider-header">
                                        <label>Intensity</label>
                                        <span>{intensity}%</span>
                                    </div>
                                    <input type="range" min="10" max="100" value={intensity}
                                        onChange={e => setIntensity(+e.target.value)} className="pp-slider" />
                                </div>
                                <div className="pp-slider-group">
                                    <div className="pp-slider-header">
                                        <label>Opacity</label>
                                        <span>{opacity}%</span>
                                    </div>
                                    <input type="range" min="10" max="100" value={opacity}
                                        onChange={e => setOpacity(+e.target.value)} className="pp-slider" />
                                </div>
                                <div className="pp-slider-group">
                                    <div className="pp-slider-header">
                                        <label>Brightness</label>
                                        <span>{brightness}%</span>
                                    </div>
                                    <input type="range" min="60" max="140" value={brightness}
                                        onChange={e => setBrightness(+e.target.value)} className="pp-slider" />
                                </div>
                            </div>
                        </div>

                        {/* Color History */}
                        {colorHistory.length > 0 && (
                            <div className="pp-card">
                                <h3 className="pp-card-title"><FiClock size={16} /> Color History</h3>
                                <div className="pp-history">
                                    {colorHistory.map((c, i) => (
                                        <div
                                            key={i}
                                            className="pp-history-item"
                                            onClick={() => { setSelectedColor(c.hex); setCustomColor(c.hex); }}
                                            title={c.name}
                                        >
                                            <div className="pp-history-dot" style={{ background: c.hex }} />
                                            <span>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Panel: Canvas Preview ──────────────────── */}
                    <div className="pp-preview-panel">
                        {/* Toolbar */}
                        <div className="pp-toolbar">
                            <div className="pp-toolbar-left">
                                <button className="pp-tool-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom In">
                                    <FiZoomIn size={16} />
                                </button>
                                <button className="pp-tool-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom Out">
                                    <FiZoomOut size={16} />
                                </button>
                                <span className="pp-zoom-label">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="pp-toolbar-right">
                                <button
                                    className={`pp-tool-btn ${compareMode ? 'active' : ''}`}
                                    onClick={() => { if (colorApplied) setCompareMode(!compareMode); else toast('Apply a color first'); }}
                                    title="Compare mode"
                                >
                                    <FiEye size={16} /> Compare
                                </button>
                            </div>
                        </div>

                        {/* Canvas Container */}
                        <div className="pp-canvas-wrapper">
                            {isProcessing && (
                                <div className="pp-processing">
                                    <div className="pp-spinner" />
                                    <span>Processing...</span>
                                </div>
                            )}

                            <div className="pp-canvas-scroll" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                                {/* Original canvas (hidden, used for data) */}
                                <canvas ref={origCanvasRef} style={{ display: 'none' }} />

                                {/* Main canvas */}
                                <canvas ref={canvasRef} className="pp-canvas" />

                                {/* Split compare overlay */}
                                {compareMode && colorApplied && originalSrc && (
                                    <div className="pp-compare-overlay">
                                        <div
                                            className="pp-compare-original"
                                            style={{ width: `${splitPos}%` }}
                                        >
                                            <img src={originalSrc} alt="Original" className="pp-compare-img" />
                                            <div className="pp-compare-label pp-label-left">Original</div>
                                        </div>
                                        <div
                                            className="pp-compare-divider"
                                            style={{ left: `${splitPos}%` }}
                                            onMouseDown={() => setIsDraggingSplit(true)}
                                        >
                                            <div className="pp-divider-handle">⟺</div>
                                        </div>
                                        <div className="pp-compare-label pp-label-right">New Color</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pp-actions">
                            <button
                                className="pp-btn pp-btn-primary"
                                onClick={() => applyColor(selectedColor)}
                                disabled={isProcessing || !originalImage}
                            >
                                {isProcessing ? <span className="btn-spinner" /> : '🖌️'} Apply Color
                            </button>
                            <button
                                className="pp-btn pp-btn-secondary"
                                onClick={resetImage}
                                disabled={!colorApplied}
                            >
                                <FiRefreshCw size={15} /> Reset
                            </button>
                            <button
                                className="pp-btn pp-btn-download"
                                onClick={downloadImage}
                                disabled={!originalImage}
                            >
                                <FiDownload size={15} /> Download
                            </button>
                            <button
                                className="pp-btn pp-btn-ghost"
                                onClick={() => { resetImage(); setActiveTab('brand'); }}
                            >
                                🎨 Try Another
                            </button>
                        </div>

                        {/* Quick Color Row */}
                        <div className="pp-quick-colors">
                            <span className="pp-quick-label">Quick apply:</span>
                            {BRAND_COLORS.slice(0, 10).map(c => (
                                <button
                                    key={c.hex}
                                    className={`pp-quick-dot ${selectedColor === c.hex ? 'selected' : ''}`}
                                    style={{ background: c.hex }}
                                    title={c.name}
                                    onClick={() => selectAndApply(c.hex)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaintPreview;
