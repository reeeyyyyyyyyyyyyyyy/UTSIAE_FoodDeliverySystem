import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderAPI } from '../../services/api';

interface Statistics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  average_order_value: number;
}

interface RestaurantStats {
  restaurant_id: number;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
}

export const SalesStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
    fetchRestaurantStats();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await orderAPI.getSalesStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch statistics');
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurantStats = async () => {
    try {
      const response = await orderAPI.getRestaurantSales();
      if (response.status === 'success') {
        setRestaurantStats(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch restaurant stats:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Statistics</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4" onClick={() => setError('')}>
          {error} (Click to dismiss)
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      ) : (
        <>
          {/* Overall Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-primary-600">{statistics.total_orders || 0}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600">Rp {(statistics.total_revenue || 0).toLocaleString()}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{statistics.completed_orders || 0}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">{statistics.pending_orders || 0}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Order Value</h3>
                <p className="text-3xl font-bold text-blue-600">Rp {(statistics.average_order_value || 0).toLocaleString()}</p>
              </motion.div>
            </div>
          )}

          {/* Restaurant Statistics */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Restaurant Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restaurantStats.map((stat) => (
                    <tr key={stat.restaurant_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.restaurant_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.total_orders || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp {(stat.total_revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {restaurantStats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No restaurant statistics available</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

