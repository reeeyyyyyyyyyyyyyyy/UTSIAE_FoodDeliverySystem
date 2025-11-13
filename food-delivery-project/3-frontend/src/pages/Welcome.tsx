import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl md:text-7xl font-bold text-gray-900 mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            🍔 Food Delivery
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Pesan makanan favoritmu dengan mudah dan cepat!
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="text-4xl mb-3">🍽️</div>
            <h3 className="font-semibold text-gray-800 mb-2">Restoran Terbaik</h3>
            <p className="text-sm text-gray-600">
              Pilih dari berbagai restoran terpercaya dengan menu lezat
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="text-4xl mb-3">🚗</div>
            <h3 className="font-semibold text-gray-800 mb-2">Pengiriman Cepat</h3>
            <p className="text-sm text-gray-600">
              Pesananmu akan diantar dengan cepat dan aman oleh driver profesional
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-semibold text-gray-800 mb-2">Pembayaran Mudah</h3>
            <p className="text-sm text-gray-600">
              Bayar dengan mudah dan aman melalui berbagai metode pembayaran
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/browse')}
            className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            Mulai Pesan Sekarang 🚀
          </Button>
        </motion.div>

        <motion.p
          className="mt-8 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Sudah punya akun?{' '}
          <button
            onClick={() => navigate('/browse')}
            className="text-orange-500 hover:text-orange-600 font-medium underline"
          >
            Login di sini
          </button>
        </motion.p>
      </div>
    </div>
  );
};

