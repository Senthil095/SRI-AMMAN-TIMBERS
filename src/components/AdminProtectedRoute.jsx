import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = sessionStorage.getItem('adminToken') === 'true';

    if (!isAuthenticated) {
        // Redirect to admin login if not authenticated
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminProtectedRoute;
