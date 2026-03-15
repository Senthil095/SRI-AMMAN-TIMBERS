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

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const { userRole } = useAuth();
    const location = useLocation();
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

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<ProductManagement />} />
                <Route path="/admin/employees" element={<EmployeeManagement />} />
                <Route path="/admin/attendance" element={<Attendance />} />
                <Route path="/admin/salary" element={<SalaryManagement />} />
                <Route path="/admin/orders" element={<OrderManagement />} />
                <Route path="/admin/customers" element={<CustomerManagement />} />
                <Route path="/admin/inventory" element={<InventoryManagement />} />
                <Route path="/admin/suppliers" element={<SupplierManagement />} />
                <Route path="/admin/purchases" element={<PurchaseManagement />} />
                <Route path="/admin/billing" element={<BillingManagement />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/activity-logs" element={<ActivityLogs />} />
                <Route path="/admin/settings" element={<Settings />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
