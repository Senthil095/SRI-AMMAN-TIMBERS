import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FiSave, FiSettings, FiShoppingBag, FiMonitor } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Admin.css';

const DEFAULT_SETTINGS = {
    shop: { name: 'Sri Amman Paints', address: '', phone: '', email: '' },
    business: { taxPercent: 18, currency: 'INR', deliveryCharges: 0, workingHours: '9:00 AM - 7:00 PM' },
    system: { enableNotifications: true, enableDarkMode: false },
};

const Settings = () => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'appSettings'));
                if (snap.exists()) {
                    const data = snap.data();
                    setSettings({
                        shop: { ...DEFAULT_SETTINGS.shop, ...data.shop },
                        business: { ...DEFAULT_SETTINGS.business, ...data.business },
                        system: { ...DEFAULT_SETTINGS.system, ...data.system },
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'appSettings'), {
                ...settings,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Settings saved!');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateShop = (key, value) => {
        setSettings(prev => ({ ...prev, shop: { ...prev.shop, [key]: value } }));
    };

    const updateBusiness = (key, value) => {
        setSettings(prev => ({ ...prev, business: { ...prev.business, [key]: value } }));
    };

    const toggleSystem = (key) => {
        setSettings(prev => ({ ...prev, system: { ...prev.system, [key]: !prev.system[key] } }));
    };

    if (loading) {
        return (
            <AdminLayout title="Settings" subtitle="Configure your system">
                <div className="loading-center"><div className="spinner" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Settings" subtitle="Configure your system">
            {/* Shop Settings */}
            <div className="admin-form-card fade-in">
                <div className="settings-section">
                    <h3><FiSettings size={16} /> Shop Settings</h3>
                    <div className="admin-form-grid">
                        <div className="form-group">
                            <label className="form-label">Shop Name</label>
                            <input className="form-input" value={settings.shop.name}
                                onChange={(e) => updateShop('name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={settings.shop.phone}
                                onChange={(e) => updateShop('phone', e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" value={settings.shop.email}
                                onChange={(e) => updateShop('email', e.target.value)} placeholder="shop@example.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input className="form-input" value={settings.shop.address}
                                onChange={(e) => updateShop('address', e.target.value)} placeholder="Full shop address" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Settings */}
            <div className="admin-form-card fade-in">
                <div className="settings-section">
                    <h3><FiShoppingBag size={16} /> Business Settings</h3>
                    <div className="admin-form-grid">
                        <div className="form-group">
                            <label className="form-label">Tax Percentage (%)</label>
                            <input type="number" className="form-input" value={settings.business.taxPercent}
                                onChange={(e) => updateBusiness('taxPercent', parseFloat(e.target.value) || 0)} min="0" max="100" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select className="form-select" value={settings.business.currency}
                                onChange={(e) => updateBusiness('currency', e.target.value)}>
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Delivery Charges (₹)</label>
                            <input type="number" className="form-input" value={settings.business.deliveryCharges}
                                onChange={(e) => updateBusiness('deliveryCharges', parseFloat(e.target.value) || 0)} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Working Hours</label>
                            <input className="form-input" value={settings.business.workingHours}
                                onChange={(e) => updateBusiness('workingHours', e.target.value)} placeholder="9:00 AM - 7:00 PM" />
                        </div>
                    </div>
                </div>
            </div>

            {/* System Settings */}
            <div className="admin-form-card fade-in">
                <div className="settings-section">
                    <h3><FiMonitor size={16} /> System Settings</h3>
                    <div className="settings-toggle">
                        <span className="settings-toggle-label">Enable Notifications</span>
                        <button
                            className={`toggle-switch ${settings.system.enableNotifications ? 'active' : ''}`}
                            onClick={() => toggleSystem('enableNotifications')}
                        />
                    </div>
                    <div className="settings-toggle">
                        <span className="settings-toggle-label">Enable Dark Mode</span>
                        <button
                            className={`toggle-switch ${settings.system.enableDarkMode ? 'active' : ''}`}
                            onClick={() => toggleSystem('enableDarkMode')}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="btn-spinner" /> : <><FiSave size={16} /> Save Settings</>}
                </button>
            </div>
        </AdminLayout>
    );
};

export default Settings;
