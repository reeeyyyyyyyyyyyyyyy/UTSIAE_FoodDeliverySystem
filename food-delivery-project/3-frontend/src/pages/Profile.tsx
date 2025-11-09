import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Address {
  id: number;
  label: string;
  full_address: string;
  is_default: boolean;
}

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    full_address: '',
    is_default: false,
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await userAPI.getAddresses();
        if (response.status === 'success') {
          setAddresses(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userAPI.createAddress(newAddress);
      if (response.status === 'success') {
        setAddresses([...addresses, response.data]);
        setNewAddress({ label: '', full_address: '', is_default: false });
        setShowAddAddress(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add address');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-800">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-800">{user?.email}</p>
            </div>
            {user?.phone && (
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-800">{user.phone}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Addresses</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Cancel' : 'Add Address'}
            </Button>
          </div>

          {showAddAddress && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddAddress}
              className="mb-4 space-y-3"
            >
              <Input
                label="Label"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                placeholder="e.g., Home, Office"
                required
              />
              <Input
                label="Full Address"
                value={newAddress.full_address}
                onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                placeholder="Enter full address"
                required
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Set as default</span>
              </label>
              <Button type="submit" variant="primary" size="sm">
                Add Address
              </Button>
            </motion.form>
          )}

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-gray-600">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-gray-600">No addresses added yet</p>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-3 border rounded-lg border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{address.label}</p>
                      <p className="text-sm text-gray-600">{address.full_address}</p>
                      {address.is_default && (
                        <span className="text-xs text-primary-600">Default</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

