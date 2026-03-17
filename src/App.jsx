import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Shared
import Navbar from './components/Navbar';

// Customer Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import PaintPreview from './pages/PaintPreview';
import CartPage from './pages/CartPage';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Attendance from './pages/admin/Attendance';
import SalaryManagement from './pages/admin/SalaryManagement';
import OrderManagement from './pages/admin/OrderManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import SupplierManagement from './pages/admin/SupplierManagement';
import PurchaseManagement from './pages/admin/PurchaseManagement';
import BillingManagement from './pages/admin/BillingManagement';
import Reports from './pages/admin/Reports';
import ActivityLogs from './pages/admin/ActivityLogs';
import Settings from './pages/admin/Settings';

// Admin Authentication Route
import AdminLogin from './pages/admin/AdminLogin';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const { userRole } = useAuth();
    const location = useLocation();
    
    // Hide navbar on all admin routes, including login
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Navbar />}
            <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/paint-preview" element={<PaintPreview />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Auth Route */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/products" element={<AdminProtectedRoute><ProductManagement /></AdminProtectedRoute>} />
                <Route path="/admin/employees" element={<AdminProtectedRoute><EmployeeManagement /></AdminProtectedRoute>} />
                <Route path="/admin/attendance" element={<AdminProtectedRoute><Attendance /></AdminProtectedRoute>} />
                <Route path="/admin/salary" element={<AdminProtectedRoute><SalaryManagement /></AdminProtectedRoute>} />
                <Route path="/admin/orders" element={<AdminProtectedRoute><OrderManagement /></AdminProtectedRoute>} />
                <Route path="/admin/customers" element={<AdminProtectedRoute><CustomerManagement /></AdminProtectedRoute>} />
                <Route path="/admin/inventory" element={<AdminProtectedRoute><InventoryManagement /></AdminProtectedRoute>} />
                <Route path="/admin/suppliers" element={<AdminProtectedRoute><SupplierManagement /></AdminProtectedRoute>} />
                <Route path="/admin/purchases" element={<AdminProtectedRoute><PurchaseManagement /></AdminProtectedRoute>} />
                <Route path="/admin/billing" element={<AdminProtectedRoute><BillingManagement /></AdminProtectedRoute>} />
                <Route path="/admin/reports" element={<AdminProtectedRoute><Reports /></AdminProtectedRoute>} />
                <Route path="/admin/activity-logs" element={<AdminProtectedRoute><ActivityLogs /></AdminProtectedRoute>} />
                <Route path="/admin/settings" element={<AdminProtectedRoute><Settings /></AdminProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
