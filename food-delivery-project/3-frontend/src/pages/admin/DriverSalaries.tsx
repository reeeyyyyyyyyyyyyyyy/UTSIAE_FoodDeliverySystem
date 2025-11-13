import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { driverAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Salary {
  id: number;
  driver_id: number;
  driver_name?: string;
  amount: number;
  period: string;
  status: string;
  created_at: string;
}

interface Driver {
  id: number;
  name: string;
  email: string;
}

export const DriverSalaries: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingSalaryFor, setCreatingSalaryFor] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchSalaries();
    fetchDrivers();
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

  const handleCreateSalary = async (driverId: number) => {
    const period = selectedPeriod[driverId];
    if (!period) {
      setError('Please select a period first');
      return;
    }

    setError('');
    setSuccess('');
    setCreatingSalaryFor(driverId);
    try {
      const response = await driverAPI.createDriverSalary({
        driver_id: driverId,
        period: period,
      });
      if (response.status === 'success') {
        setSuccess('Salary created successfully!');
        setSelectedPeriod({ ...selectedPeriod, [driverId]: '' });
        setCreatingSalaryFor(null);
        await fetchSalaries();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create salary');
      setCreatingSalaryFor(null);
    }
  };

  const handleUpdateStatus = async (salaryId: number, status: string) => {
    setError('');
    setSuccess('');
    try {
      const response = await driverAPI.updateSalaryStatus(salaryId, status);
      if (response.status === 'success') {
        setSuccess('Salary status updated successfully!');
        await fetchSalaries();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update salary status');
    }
  };

  // Get all drivers that don't have a salary for the selected period
  const getDriversWithoutSalary = (period: string) => {
    if (!period) return drivers;
    const driversWithSalary = salaries
      .filter(s => s.period === period)
      .map(s => s.driver_id);
    return drivers.filter(d => !driversWithSalary.includes(d.id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Driver Salaries</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4" onClick={() => setError('')}>
          {error} (Click to dismiss)
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4" onClick={() => setSuccess('')}>
          {success} (Click to dismiss)
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading salaries...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaries.map((salary, index) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salary.driver_name || `Driver ${salary.driver_id}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rp {salary.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salary.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          salary.status.toLowerCase() === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : salary.status.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {salary.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(salary.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2 items-center">
                        {salary.status.toLowerCase() === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateStatus(salary.id, 'PAID')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark as Paid
                            </Button>
                          </>
                        )}
                        {salary.status.toLowerCase() === 'paid' && (
                          <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {salaries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No salaries found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Salary Section for Each Driver */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Salary for Drivers</h2>
        <div className="space-y-4">
          {drivers.map((driver) => {
            const hasSalary = salaries.some(s => s.driver_id === driver.id);
            const period = selectedPeriod[driver.id] || '';
            const isCreating = creatingSalaryFor === driver.id;
            
            return (
              <div key={driver.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{driver.name}</p>
                  <p className="text-sm text-gray-500">{driver.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <select
                      value={period.split('-')[0] || ''}
                      onChange={(e) => {
                        const year = e.target.value;
                        const month = period.split('-')[1] || '';
                        setSelectedPeriod({ ...selectedPeriod, [driver.id]: month ? `${year}-${month}` : year });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isCreating}
                    >
                      <option value="">-- Year --</option>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      value={period.split('-')[1] || ''}
                      onChange={(e) => {
                        const month = e.target.value;
                        const year = period.split('-')[0] || '';
                        setSelectedPeriod({ ...selectedPeriod, [driver.id]: year ? `${year}-${month}` : month });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isCreating}
                    >
                      <option value="">-- Month --</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={String(month).padStart(2, '0')}>
                          {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateSalary(driver.id)}
                    disabled={!period || isCreating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isCreating ? 'Creating...' : 'Create Salary'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

