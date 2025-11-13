import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  addresses: Array<{
    id: number;
    label: string;
    full_address: string;
    is_default: boolean;
  }>;
  created_at: string;
}

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await userAPI.getAllUsers();
      if (response.status === 'success') {
        setUsers(response.data || []);
        setFilteredUsers(response.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch users');
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (roleFilter === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.role === roleFilter));
    }
  }, [roleFilter, users]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('all')}
          >
            All ({users.length})
          </Button>
          <Button
            variant={roleFilter === 'customer' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('customer')}
          >
            Customer ({users.filter((u) => u.role === 'customer').length})
          </Button>
          <Button
            variant={roleFilter === 'driver' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('driver')}
          >
            Driver ({users.filter((u) => u.role === 'driver').length})
          </Button>
          <Button
            variant={roleFilter === 'admin' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('admin')}
          >
            Admin ({users.filter((u) => u.role === 'admin').length})
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4" onClick={() => setError('')}>
          {error} (Click to dismiss)
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading users...</p>
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Addresses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'driver'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.addresses.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gray-50 border-t"
            >
              <h3 className="text-lg font-semibold mb-4">User Details: {selectedUser.name}</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {selectedUser.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {selectedUser.phone || 'Not provided'}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {selectedUser.role}
                </p>
                <div>
                  <span className="font-medium">Addresses:</span>
                  {selectedUser.addresses.length === 0 ? (
                    <p className="text-gray-500 ml-2">No addresses</p>
                  ) : (
                    <ul className="list-disc list-inside ml-2">
                      {selectedUser.addresses.map((addr) => (
                        <li key={addr.id} className="text-sm text-gray-600">
                          {addr.label}: {addr.full_address} {addr.is_default && '(Default)'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found{roleFilter !== 'all' ? ` with role: ${roleFilter}` : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

