import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { driverAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { formatRupiah } from '../../utils/format';

interface Salary {
  id: number;
  driver_id: number;
  driver_name?: string;
  driver_email?: string;
  total_earnings?: number; // Total pendapatan dari driver_salaries
  status: string;
  created_at: string;
}

interface Driver {
  id: number;
  name: string;
  email: string;
  total_earnings?: number; // Total earnings saat ini (belum dibayar)
  active_orders?: number;
}

export const DriverSalaries: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [markingAsPaid, setMarkingAsPaid] = useState<number | null>(null);

  useEffect(() => {
    fetchSalaries();
    fetchDrivers();
    // Auto-refresh every 5 seconds for real-time SOA data
    const interval = setInterval(() => {
      fetchSalaries();
      fetchDrivers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAllDrivers();
      if (response.status === 'success') {
        setDrivers(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await driverAPI.getDriverSalaries();
      if (response.status === 'success') {
        setSalaries(response.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch salaries');
      console.error('Failed to fetch salaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (driverId: number) => {
    setError('');
    setSuccess('');
    setMarkingAsPaid(driverId);
    try {
      const response = await driverAPI.markDriverEarningsAsPaid(driverId);
      if (response.status === 'success') {
        const driverName = drivers.find(d => d.id === driverId)?.name || 'driver';
        setSuccess(`Salary marked as paid successfully for ${driverName}! Total earnings reset to 0.`);
        await fetchSalaries();
        await fetchDrivers();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark earnings as paid');
    } finally {
      setMarkingAsPaid(null);
    }
  };

  // Get total pendapatan (total_earnings) from driver_salaries for each driver
  const getTotalPendapatan = (driverId: number): number => {
    const driverSalaries = salaries.filter(s => s.driver_id === driverId);
    // Sum all total_earnings from driver_salaries (SOA: from Driver Service)
    // Ensure proper number conversion to avoid string concatenation
    return driverSalaries.reduce((sum, salary) => {
      const earnings = typeof salary.total_earnings === 'number' 
        ? salary.total_earnings 
        : parseFloat(String(salary.total_earnings || 0));
      return sum + (isNaN(earnings) ? 0 : earnings);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Driver Salaries</h1>
        <p className="text-sm text-gray-500">Real-time data from Driver Service (SOA)</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 cursor-pointer" onClick={() => setError('')}>
          {error} (Click to dismiss)
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 cursor-pointer" onClick={() => setSuccess('')}>
          {success} (Click to dismiss)
        </div>
      )}

      {/* Single Table: All Drivers with Salaries */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Salary Records</h2>
          <p className="text-sm text-gray-500 mt-1">All drivers with their salary information (Real-time SOA data)</p>
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading salaries...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings (Unpaid)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pendapatan (Paid)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                      No drivers found
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver, index) => {
                    const hasEarnings = driver.total_earnings && driver.total_earnings > 0;
                    const isMarking = markingAsPaid === driver.id;
                    const totalPendapatan = getTotalPendapatan(driver.id); // Total dari driver_salaries (SOA)

                    return (
                      <motion.tr
                        key={driver.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatRupiah(driver.total_earnings || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatRupiah(totalPendapatan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasEarnings ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              BELUM DIGAJI
                            </span>
                          ) : totalPendapatan > 0 ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor('PAID')}`}>
                              PAID
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              NO SALARY
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasEarnings ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkAsPaid(driver.id)}
                              disabled={isMarking}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {isMarking ? 'Processing...' : 'Mark as Paid'}
                            </Button>
                          ) : totalPendapatan > 0 ? (
                            <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                              No Earnings
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
