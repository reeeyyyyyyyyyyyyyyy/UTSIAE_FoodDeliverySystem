import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { OrderStatus } from './pages/OrderStatus';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

const DriverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isDriver } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isDriver) return <Navigate to="/" />;
  return <>{children}</>;
};

const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isCustomer) return <Navigate to="/" />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navbar />
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse"
        element={
          <>
            <Navbar />
            <Home />
          </>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Navbar />
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <DriverRoute>
            <Navbar />
            <DriverDashboard />
          </DriverRoute>
        }
      />
      <Route
        path="/restaurants/:id"
        element={
          <CustomerRoute>
            <Navbar />
            <RestaurantDetail />
          </CustomerRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <CustomerRoute>
            <Navbar />
            <Orders />
          </CustomerRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <OrderStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Navbar />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;

