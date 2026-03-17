import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
    });

    useEffect(() => {
        let mounted = true;
        const fetchProfile = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, 'customers', currentUser.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists() && mounted) {
                    const data = docSnap.data();
                    setForm({
                        name: data.name || currentUser.displayName || '',
                        email: data.email || currentUser.email || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || '',
                        pincode: data.pincode || '',
                    });
                } else if (mounted) {
                    // Fallback to basic current user info if not found in customers collection
                    setForm(prev => ({
                        ...prev,
                        name: currentUser.displayName || '',
                        email: currentUser.email || '',
                    }));
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                toast.error('Failed to load profile data');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProfile();
        return () => { mounted = false; };
    }, [currentUser]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone) {
            toast.error('Name and Phone number are required');
            return;
        }

        setSaving(true);
        try {
            await setDoc(doc(db, 'customers', currentUser.uid), {
                ...form,
                email: currentUser.email, // Ensure email cannot be spoofed here
            }, { merge: true }); // Use merge carefully so we don't overwrite registration date
            
            // Also sync the name back to the central users auth collection, just in case
            await setDoc(doc(db, 'users', currentUser.uid), {
                displayName: form.name
            }, { merge: true });

            toast.success('Profile updated successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="page-wrapper"><div className="loading-center"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="page-wrapper profile-page">
            <div className="container">
                <div className="profile-header fade-in">
                    <h1 className="section-title">My Profile</h1>
                    <p className="section-subtitle">Manage your personal information and delivery details</p>
                </div>

                <div className="profile-card fade-in slide-up">
                    <form onSubmit={handleSave}>
                        <div className="profile-form-grid">
                            
                            {/* Readonly Email */}
                            <div className="form-group profile-form-group full-width">
                                <label className="form-label">Email Address</label>
                                <div className="input-wrapper">
                                    <FiMail className="input-icon" size={16} />
                                    <input
                                        type="email"
                                        className="form-input with-icon readonly-input"
                                        value={form.email}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <span style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '4px'}}>Email cannot be changed</span>
                            </div>

                            {/* Full Name */}
                            <div className="form-group profile-form-group">
                                <label className="form-label">Full Name <span style={{color: 'red'}}>*</span></label>
                                <div className="input-wrapper">
                                    <FiUser className="input-icon" size={16} />
                                    <input
                                        name="name"
                                        className="form-input with-icon"
                                        placeholder="Your full name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="form-group profile-form-group">
                                <label className="form-label">Phone Number <span style={{color: 'red'}}>*</span></label>
                                <div className="input-wrapper">
                                    <FiPhone className="input-icon" size={16} />
                                    <input
                                        name="phone"
                                        className="form-input with-icon"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="form-group profile-form-group full-width">
                                <label className="form-label">Street Address</label>
                                <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
                                    <FiMapPin className="input-icon" size={16} style={{ top: '22px' }} />
                                    <textarea
                                        name="address"
                                        className="form-textarea with-icon"
                                        style={{ paddingLeft: '42px' }}
                                        placeholder="House No, Building, Street Name"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* City */}
                            <div className="form-group profile-form-group">
                                <label className="form-label">City</label>
                                <input
                                    name="city"
                                    className="form-input"
                                    placeholder="City or Town"
                                    value={form.city}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Pincode */}
                            <div className="form-group profile-form-group">
                                <label className="form-label">PIN Code</label>
                                <input
                                    name="pincode"
                                    className="form-input"
                                    placeholder="e.g. 600001"
                                    value={form.pincode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                                style={{ minWidth: '160px' }}
                            >
                                {saving ? <span className="btn-spinner" /> : <><FiSave size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
