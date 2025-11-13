import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { AuthModal } from '../AuthModal';
import { showConfirm, showSuccess } from '../../utils/swal';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isDriver, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    const result = await showConfirm(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin logout?',
      'Ya, Logout',
      'Batal'
    );
    
    if (result.isConfirmed) {
      logout();
      await showSuccess('Logout Berhasil! 👋', 'Sampai jumpa kembali!');
      navigate('/');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.span
                className="text-3xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                🍔
              </motion.span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-orange-700 transition-all">
                Food Delivery
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          isActive('/admin') || isActive('/admin/restaurants') || 
                          isActive('/admin/users') || isActive('/admin/drivers') || 
                          isActive('/admin/salaries') || isActive('/admin/statistics') || 
                          isActive('/admin/orders')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        Admin Menu ▼
                      </button>
                      <AnimatePresence>
                        {showAdminMenu && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-orange-100 py-2 z-50"
                            >
                              <Link
                                to="/admin"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                📊 Dashboard
                              </Link>
                              <Link
                                to="/admin/restaurants"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                🍽️ Manage Restaurants
                              </Link>
                              <Link
                                to="/admin/users"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                👥 Manage Users
                              </Link>
                              <Link
                                to="/admin/drivers"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                🚗 Track Drivers
                              </Link>
                              <Link
                                to="/admin/salaries"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                💰 Driver Salaries
                              </Link>
                              <Link
                                to="/admin/statistics"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                📈 Sales Statistics
                              </Link>
                              <Link
                                to="/admin/orders"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                onClick={() => setShowAdminMenu(false)}
                              >
                                📦 Track Orders
                              </Link>
                            </motion.div>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowAdminMenu(false)}
                            />
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {isDriver && (
                    <Link
                      to="/driver"
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive('/driver')
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      🚗 Driver Dashboard
                    </Link>
                  )}
                  {isCustomer && (
                    <>
                      <Link
                        to="/browse"
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          isActive('/browse')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        🍽️ Restaurants
                      </Link>
                      <Link
                        to="/orders"
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          isActive('/orders')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        📦 My Orders
                      </Link>
                    </>
                  )}
                  <Link
                    to="/profile"
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive('/profile')
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    👤 Profile
                  </Link>
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <span className="text-sm text-gray-600 hidden md:inline">
                      Hello, <span className="font-semibold text-gray-900">{user?.name}</span>{' '}
                      {isAdmin && '👑'} {isDriver && '🚗'} 👋
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAuthModal(true)}
                    className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowAuthModal(true);
                      // Will be handled by AuthModal's initialView
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />
    </>
  );
};
