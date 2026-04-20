import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BrowsePackages from './pages/BrowsePackages';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import ManageOrders from './pages/ManageOrders';
import OrderDetails from './pages/OrderDetails';
import ManagePackages from './pages/ManagePackages';
import ManageInventory from './pages/ManageInventory';

// Protected route wrapper
const ProtectedRoute = ({ children, requireStaff = false }) => {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireStaff && !isStaff()) {
    return <Navigate to="/" />;
  }

  return children;
};

// Public route wrapper
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const { user, isStaff } = useAuth();

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* --- 1. PUBLIC ROUTES (Accessible to everyone) --- */}
          {/* LECTURER UPDATE: Browse is now public */}
          <Route path="/browse" element={<BrowsePackages />} />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* --- 2. HOME REDIRECT LOGIC --- */}
          <Route
            path="/"
            element={
              user ? (
                isStaff() ? <Navigate to="/dashboard" /> : <Navigate to="/browse" />
              ) : (
                <Navigate to="/browse" /> 
              )
            }
          />

          {/* --- 3. STAFF/ADMIN ROUTES (Protected) --- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireStaff={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute requireStaff={true}>
                <ManageOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute requireStaff={true}>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute requireStaff={true}>
                <ManagePackages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requireStaff={true}>
                <ManageInventory />
              </ProtectedRoute>
            }
          />

          {/* --- 4. CUSTOMER PROTECTED ROUTES (Login required to buy) --- */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;