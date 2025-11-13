import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { driverAPI } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import { Button } from '../../components/ui/Button';

interface ActiveOrder {
  order_id: number;
  customer_name: string;
  restaurant_name: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface Driver {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  license_number: string;
  vehicle_type: string;
  is_available: boolean;
  is_on_job: boolean;
  active_orders: number;
  active_orders_details?: ActiveOrder[];
  total_earnings: number;
  created_at: string;
}

export const TrackDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrivers();
    // Auto-refresh every 5 seconds to get real-time updates
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await driverAPI.getAllDrivers();
      if (response.status === 'success') {
        setDrivers(response.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch drivers');
      console.error('Failed to fetch drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Track Drivers</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4" onClick={() => setError('')}>
          {error} (Click to dismiss)
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{driver.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    driver.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {driver.is_available ? 'Available' : 'Busy'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-600">Phone:</span> {driver.phone || '-'}
                </p>
                <p>
                  <span className="font-medium text-gray-600">License:</span> {driver.license_number}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Vehicle:</span> {driver.vehicle_type}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Active Jobs:</span>{' '}
                  <span className={`font-semibold ${driver.active_orders > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                    {driver.active_orders}
                  </span>
                </p>
                {driver.active_orders > 0 && driver.active_orders_details && driver.active_orders_details.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium text-gray-700 mb-2">Current Jobs:</p>
                    {driver.active_orders_details.map((order) => (
                      <div key={order.order_id} className="mb-2 p-2 bg-orange-50 rounded text-xs">
                        <p className="font-medium text-gray-800">Order #{order.order_id}</p>
                        <p className="text-gray-600">Restaurant: {order.restaurant_name}</p>
                        <p className="text-gray-600">Customer: {order.customer_name}</p>
                        <p className="text-gray-600">Status: <span className="font-semibold">{order.status}</span></p>
                        <p className="text-gray-600">Total: {formatRupiah(order.total_price || 0)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p>
                  <span className="font-medium text-gray-600">Total Earnings:</span>{' '}
                  <span className="font-semibold text-green-600">
                    {formatRupiah(driver.total_earnings || 0)}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-gray-600">Joined:</span>{' '}
                  {new Date(driver.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}

          {drivers.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">No drivers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

