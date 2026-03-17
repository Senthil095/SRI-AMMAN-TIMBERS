import React, { useState, useMemo } from 'react';
import { FiMaximize, FiLayers, FiDroplet, FiAlertCircle } from 'react-icons/fi';
import './PaintCalculator.css';

/**
 * Returns a recommended purchase combination of 20L, 10L, 5L, 1L buckets
 * that covers the required liters with minimal waste.
 */
const getRecommendation = (liters) => {
    const buckets = [20, 10, 5, 1];
    const combo = [];
    let remaining = liters;

    for (const size of buckets) {
        const count = Math.floor(remaining / size);
        if (count > 0) {
            combo.push(`${count} × ${size}L`);
            remaining -= count * size;
        }
    }

    return combo.join(' + ');
};

const PaintCalculator = () => {
    const [length, setLength] = useState('');
    const [height, setHeight] = useState('');
    const [coats, setCoats] = useState(2);
    const [touched, setTouched] = useState(false);

    const lengthNum = parseFloat(length);
    const heightNum = parseFloat(height);

    const isValid = length !== '' && height !== '' && lengthNum > 0 && heightNum > 0;
    const showError = touched && !isValid && (length !== '' || height !== '');

    const result = useMemo(() => {
        if (!isValid) return null;
        const area = lengthNum * heightNum;
        const totalArea = area * coats;
        const liters = Math.ceil(totalArea / 100);
        return {
            area,
            totalArea,
            liters,
            recommendation: getRecommendation(liters),
        };
    }, [lengthNum, heightNum, coats, isValid]);

    const handleInput = (setter) => (e) => {
        setTouched(true);
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setter(val);
        }
    };

    return (
        <div className="pc-card">
            {/* Header */}
            <div className="pc-header">
                <div className="pc-header-icon">
                    <FiMaximize size={18} />
                </div>
                <div className="pc-header-text">
                    <h3>Paint Calculator</h3>
                    <p>Estimate how much paint you need</p>
                </div>
            </div>

            {/* Inputs */}
            <div className="pc-inputs">
                <div className="pc-field">
                    <label className="pc-label">
                        <span className="pc-label-icon"><FiMaximize size={12} /></span>
                        Wall Length (ft)
                    </label>
                    <input
                        id="pc-length"
                        type="text"
                        inputMode="decimal"
                        className={`pc-input ${showError && !lengthNum ? 'error' : ''}`}
                        placeholder="e.g. 12"
                        value={length}
                        onChange={handleInput(setLength)}
                    />
                </div>

                <div className="pc-field">
                    <label className="pc-label">
                        <span className="pc-label-icon"><FiMaximize size={12} /></span>
                        Wall Height (ft)
                    </label>
                    <input
                        id="pc-height"
                        type="text"
                        inputMode="decimal"
                        className={`pc-input ${showError && !heightNum ? 'error' : ''}`}
                        placeholder="e.g. 10"
                        value={height}
                        onChange={handleInput(setHeight)}
                    />
                </div>

                <div className="pc-field full-width">
                    <label className="pc-label">
                        <span className="pc-label-icon"><FiLayers size={12} /></span>
                        Number of Coats
                    </label>
                    <select
                        id="pc-coats"
                        className="pc-select"
                        value={coats}
                        onChange={(e) => setCoats(Number(e.target.value))}
                    >
                        <option value={1}>1 Coat</option>
                        <option value={2}>2 Coats (Recommended)</option>
                        <option value={3}>3 Coats</option>
                    </select>
                </div>
            </div>

            {/* Validation Error */}
            {showError && (
                <div className="pc-error">
                    <FiAlertCircle size={14} />
                    Please enter valid wall dimensions
                </div>
            )}

            <div className="pc-divider" />

            {/* Result */}
            {result ? (
                <div className="pc-result" key={`${result.liters}-${coats}`}>
                    <div className="pc-result-main">
                        <div className="pc-result-label">
                            <FiDroplet size={16} />
                            Estimated Paint Required
                        </div>
                        <div className="pc-result-value">
                            {result.liters}<span>Liters</span>
                        </div>
                    </div>

                    <div className="pc-recommend">
                        <span className="pc-recommend-icon">🪣</span>
                        <div className="pc-recommend-text">
                            Recommended Purchase: <strong>{result.recommendation}</strong>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="pc-empty">Enter wall dimensions to see estimate</p>
            )}
        </div>
    );
};

export default PaintCalculator;
