import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && userRole !== 'admin') {
        console.warn('Access denied: User is not admin. Role:', userRole);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
