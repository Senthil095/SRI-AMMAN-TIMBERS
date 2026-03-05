import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

console.log('Main.jsx mounting...');
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#1a2332',
                                color: '#f8f9fa',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontFamily: 'Inter, sans-serif',
                            },
                            success: {
                                iconTheme: { primary: '#4ade80', secondary: '#1a2332' },
                            },
                            error: {
                                iconTheme: { primary: '#f87171', secondary: '#1a2332' },
                            },
                        }}
                    />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
