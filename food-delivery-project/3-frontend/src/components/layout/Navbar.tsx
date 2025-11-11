import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
                <Link to="/" className={`hover:text-primary-600 ${isActive('/')}`}>
                  Restaurants
                </Link>
                <Link to="/orders" className={`hover:text-primary-600 ${isActive('/orders')}`}>
                  My Orders
                </Link>
                <Link to="/profile" className={`hover:text-primary-600 ${isActive('/profile')}`}>
                  Profile
                </Link>
                <div className="flex items-center gap-2">
                  <br />
                  <span className="text-gray-700 hidden md:inline">Hello, {user?.name} 👋</span>
                  <br />
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
    </nav>
  );
};

