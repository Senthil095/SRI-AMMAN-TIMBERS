import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log('AuthProvider initialized');

    const signup = async (email, password, displayName) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const timestamp = new Date().toISOString();
        
        await setDoc(doc(db, 'users', result.user.uid), {
            email,
            displayName,
            role: 'customer',
            createdAt: timestamp,
        });

        await setDoc(doc(db, 'customers', result.user.uid), {
            name: displayName,
            email: email,
            phone: '',
            address: '',
            city: '',
            pincode: '',
            registrationDate: timestamp
        });

        return result;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const googleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const timestamp = new Date().toISOString();
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: 'customer',
                    createdAt: timestamp,
                    photoURL: user.photoURL,
                });

                await setDoc(doc(db, 'customers', user.uid), {
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    email: user.email,
                    phone: '',
                    address: '',
                    city: '',
                    pincode: '',
                    registrationDate: timestamp
                });
            }
            return result;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    };

    const logout = () => signOut(auth);

    useEffect(() => {
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (!mounted) return;
                setCurrentUser(user);
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (mounted && userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } else {
                    if (mounted) setUserRole(null);
                }
                console.log('AuthStateChanged:', user ? 'User logged in' : 'No user', userRole);
            } catch (error) {
                console.error('Auth state change error:', error);
                if (mounted) setUserRole(null);
            } finally {
                if (mounted) setLoading(false);
            }
        });

        // Safety timeout in case Firebase is slow/blocked
        const timeoutId = setTimeout(() => {
            if (loading && mounted) {
                console.warn('Auth check timed out, forcing app load');
                setLoading(false);
            }
        }, 5000);

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const value = { currentUser, userRole, signup, login, googleLogin, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
