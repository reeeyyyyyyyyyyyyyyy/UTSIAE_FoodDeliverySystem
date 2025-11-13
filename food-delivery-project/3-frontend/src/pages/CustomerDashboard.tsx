import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Selamat Datang! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Pesan makanan favoritmu dengan mudah dan cepat
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-orange-500 group"
            onClick={() => navigate('/browse')}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Browse Restaurants</h2>
            <p className="text-gray-600 mb-4">
              Jelajahi berbagai restoran dan menu lezat yang tersedia
            </p>
            <Button variant="primary" className="w-full group-hover:bg-orange-600">
              Jelajahi →
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 group"
            onClick={() => navigate('/orders')}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">My Orders</h2>
            <p className="text-gray-600 mb-4">
              Lihat dan lacak riwayat pesananmu
            </p>
            <Button variant="primary" className="w-full group-hover:bg-orange-600">
              Lihat Pesanan →
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-green-500 group"
            onClick={() => navigate('/profile')}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Manage Addresses</h2>
            <p className="text-gray-600 mb-4">
              Kelola alamat pengirimanmu
            </p>
            <Button variant="primary" className="w-full group-hover:bg-orange-600">
              Kelola Alamat →
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/browse')}
            className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            🚀 Mulai Pesan Sekarang
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
