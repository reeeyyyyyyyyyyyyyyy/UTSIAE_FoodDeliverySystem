import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Food Delivery</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/browse')}
        >
          <div className="text-4xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Browse Restaurants</h2>
          <p className="text-gray-600">Explore our selection of restaurants and menus</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/orders')}
        >
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">My Orders</h2>
          <p className="text-gray-600">View and track your order history</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Manage Addresses</h2>
          <p className="text-gray-600">Add and manage your delivery addresses</p>
        </motion.div>
      </div>

      <div className="mt-8">
        <Button variant="primary" size="lg" onClick={() => navigate('/browse')}>
          Start Ordering
        </Button>
      </div>
    </div>
  );
};

