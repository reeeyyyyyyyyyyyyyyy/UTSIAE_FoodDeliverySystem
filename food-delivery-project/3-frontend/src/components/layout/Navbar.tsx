import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isDriver, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary-600 font-semibold' : 'text-gray-700';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700">
            🍔 Food Delivery
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className={`hover:text-primary-600 ${isActive('/admin') || isActive('/admin/restaurants') || isActive('/admin/users') || isActive('/admin/drivers') || isActive('/admin/salaries') || isActive('/admin/statistics') || isActive('/admin/orders') ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}
                    >
                      Admin Menu ▼
                    </button>
                    {showAdminMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          📊 Dashboard
                        </Link>
                        <Link
                          to="/admin/restaurants"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          🍽️ Manage Restaurants
                        </Link>
                        <Link
                          to="/admin/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          👥 Manage Users
                        </Link>
                        <Link
                          to="/admin/drivers"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          🚗 Track Drivers
                        </Link>
                        <Link
                          to="/admin/salaries"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          💰 Driver Salaries
                        </Link>
                        <Link
                          to="/admin/statistics"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          📈 Sales Statistics
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          📦 Track Orders
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {isDriver && (
                  <Link to="/driver" className={`hover:text-primary-600 ${isActive('/driver')}`}>
                    Driver Dashboard
                  </Link>
                )}
                {isCustomer && (
                  <>
                    <Link to="/browse" className={`hover:text-primary-600 ${isActive('/browse')}`}>
                      Restaurants
                    </Link>
                    <Link to="/orders" className={`hover:text-primary-600 ${isActive('/orders')}`}>
                      My Orders
                    </Link>
                  </>
                )}
                <Link to="/profile" className={`hover:text-primary-600 ${isActive('/profile')}`}>
                  Profile
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 hidden md:inline">
                    Hello, {user?.name} {isAdmin && '👑'} {isDriver && '🚗'} 👋
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {showAdminMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAdminMenu(false)}
        />
      )}
    </nav>
  );
};
