import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { restaurantAPI, adminAPI, orderAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatRupiah } from '../utils/format';
import { showSuccess, showError } from '../utils/swal';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  address: string;
  is_open: boolean;
  image_url?: string;
}

interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_available: boolean;
  category?: string;
  image_url?: string;
}

interface Statistics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  average_order_value: number;
}

export const AdminDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<number | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine_type: '',
    address: '',
  });
  const [newRestaurantImage, setNewRestaurantImage] = useState<File | null>(null);
  const [editRestaurant, setEditRestaurant] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    is_open: true,
  });
  const [editRestaurantImage, setEditRestaurantImage] = useState<File | null>(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Makanan',
  });
  const [newMenuItemImage, setNewMenuItemImage] = useState<File | null>(null);
  const [editMenuItem, setEditMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Makanan',
    is_available: true,
  });
  const [editMenuItemImage, setEditMenuItemImage] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRestaurants(), fetchStatistics()]);
    setIsLoading(false);
  };

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantAPI.getRestaurants();
      if (response.status === 'success') {
        setRestaurants(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await orderAPI.getSalesStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchMenuItems = async (restaurantId: number) => {
    try {
      const response = await restaurantAPI.getRestaurantMenu(restaurantId);
      if (response.status === 'success') {
        const items = response.data.menu_items || [];
        const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
        setMenuItems(uniqueItems);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newRestaurant.name);
      formData.append('cuisine_type', newRestaurant.cuisine_type);
      formData.append('address', newRestaurant.address);
      formData.append('is_open', 'true');
      if (newRestaurantImage) {
        formData.append('image', newRestaurantImage);
      }

      const response = await adminAPI.createRestaurant(formData);
      if (response.status === 'success') {
        await showSuccess('Restoran Berhasil Ditambahkan! 🎉');
        await fetchRestaurants();
        setShowAddRestaurant(false);
        setNewRestaurant({ name: '', cuisine_type: '', address: '' });
        setNewRestaurantImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Menambah Restoran', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      await showError('Pilih Restoran', 'Silakan pilih restoran terlebih dahulu');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newMenuItem.name);
      formData.append('description', newMenuItem.description);
      formData.append('price', newMenuItem.price);
      formData.append('stock', newMenuItem.stock);
      formData.append('category', newMenuItem.category);
      if (newMenuItemImage) {
        formData.append('image', newMenuItemImage);
      }

      const response = await adminAPI.createMenuItem(selectedRestaurant, formData);
      if (response.status === 'success') {
        await showSuccess('Menu Berhasil Ditambahkan! 🎉');
        await fetchMenuItems(selectedRestaurant);
        setShowAddMenu(false);
        setNewMenuItem({ name: '', description: '', price: '', stock: '', category: 'Makanan' });
        setNewMenuItemImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Menambah Menu', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleUpdateRestaurant = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editRestaurant.name);
      formData.append('cuisine_type', editRestaurant.cuisine_type);
      formData.append('address', editRestaurant.address);
      formData.append('is_open', editRestaurant.is_open.toString());
      if (editRestaurantImage) {
        formData.append('image', editRestaurantImage);
      }

      const response = await adminAPI.updateRestaurant(id, formData);
      if (response.status === 'success') {
        await showSuccess('Restoran Berhasil Diupdate! ✅');
        await fetchRestaurants();
        setEditingRestaurant(null);
        setEditRestaurantImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Mengupdate Restoran', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleUpdateMenuItem = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editMenuItem.name);
      formData.append('description', editMenuItem.description);
      formData.append('price', editMenuItem.price);
      formData.append('stock', editMenuItem.stock);
      formData.append('category', editMenuItem.category);
      formData.append('is_available', editMenuItem.is_available.toString());
      if (editMenuItemImage) {
        formData.append('image', editMenuItemImage);
      }

      const response = await adminAPI.updateMenuItem(id, formData);
      if (response.status === 'success') {
        await showSuccess('Menu Berhasil Diupdate! ✅');
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
        setEditingMenuItem(null);
        setEditMenuItemImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Mengupdate Menu', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDeleteRestaurant = async (id: number) => {
    try {
      const response = await adminAPI.deleteRestaurant(id);
      if (response.status === 'success') {
        await showSuccess('Restoran Berhasil Dihapus! ✅');
        await fetchRestaurants();
        if (selectedRestaurant === id) {
          setSelectedRestaurant(null);
          setMenuItems([]);
        }
      }
    } catch (error: any) {
      await showError('Gagal Menghapus Restoran', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    try {
      const response = await adminAPI.deleteMenuItem(id);
      if (response.status === 'success') {
        await showSuccess('Menu Berhasil Dihapus! ✅');
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
      }
    } catch (error: any) {
      await showError('Gagal Menghapus Menu', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Kelola restoran, menu, dan lihat statistik penjualan</p>
        </motion.div>

        {/* Analytics Overview */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-100 text-sm font-medium">Total Orders</span>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-3xl font-bold">{statistics.total_orders || 0}</p>
              <Link to="/admin/statistics" className="text-orange-100 text-xs mt-2 hover:underline inline-block">
                Lihat detail →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm font-medium">Total Revenue</span>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-2xl font-bold">{formatRupiah(statistics.total_revenue || 0)}</p>
              <Link to="/admin/statistics" className="text-green-100 text-xs mt-2 hover:underline inline-block">
                Lihat detail →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Completed</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold">{statistics.completed_orders || 0}</p>
              <Link to="/admin/orders" className="text-blue-100 text-xs mt-2 hover:underline inline-block">
                Lihat detail →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-100 text-sm font-medium">Pending</span>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl font-bold">{statistics.pending_orders || 0}</p>
              <Link to="/admin/orders" className="text-yellow-100 text-xs mt-2 hover:underline inline-block">
                Lihat detail →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 text-sm font-medium">Avg Order</span>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-xl font-bold">{formatRupiah(statistics.average_order_value || 0)}</p>
              <Link to="/admin/statistics" className="text-purple-100 text-xs mt-2 hover:underline inline-block">
                Lihat detail →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Link
            to="/admin/statistics"
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-semibold text-gray-900">Sales Statistics</p>
                <p className="text-sm text-gray-600">Lihat analitik penjualan</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-semibold text-gray-900">Track Orders</p>
                <p className="text-sm text-gray-600">Kelola pesanan</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/drivers"
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="font-semibold text-gray-900">Track Drivers</p>
                <p className="text-sm text-gray-600">Pantau driver</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/salaries"
            className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold text-gray-900">Driver Salaries</p>
                <p className="text-sm text-gray-600">Kelola gaji driver</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Restaurant Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kelola Restoran</h2>
              <p className="text-gray-600 text-sm mt-1">Total: {restaurants.length} restoran</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddRestaurant(true)}
              className="flex items-center gap-2"
            >
              <span>➕</span> Tambah Restoran
            </Button>
          </div>

          {/* Restaurants List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingRestaurant === restaurant.id ? (
                  <form onSubmit={(e) => handleUpdateRestaurant(e, restaurant.id)} className="space-y-3">
                    <Input
                      label="Nama"
                      value={editRestaurant.name}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Tipe Masakan"
                      value={editRestaurant.cuisine_type}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, cuisine_type: e.target.value })}
                      required
                    />
                    <Input
                      label="Alamat"
                      value={editRestaurant.address}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, address: e.target.value })}
                      required
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editRestaurant.is_open}
                        onChange={(e) => setEditRestaurant({ ...editRestaurant, is_open: e.target.checked })}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700">Buka</label>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditRestaurantImage(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" variant="primary" size="sm">Simpan</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRestaurant(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          restaurant.is_open
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {restaurant.is_open ? 'Buka' : 'Tutup'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{restaurant.address}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRestaurant(restaurant.id);
                          setEditRestaurant({
                            name: restaurant.name,
                            cuisine_type: restaurant.cuisine_type,
                            address: restaurant.address,
                            is_open: restaurant.is_open,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRestaurant(restaurant.id)}
                        className={selectedRestaurant === restaurant.id ? 'bg-orange-50 border-orange-500' : ''}
                      >
                        Menu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Menu Management */}
        {selectedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Restoran</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {restaurants.find((r) => r.id === selectedRestaurant)?.name} - {menuItems.length} menu
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAddMenu(true)}
                className="flex items-center gap-2"
              >
                <span>➕</span> Tambah Menu
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {editingMenuItem === item.id ? (
                    <form onSubmit={(e) => handleUpdateMenuItem(e, item.id)} className="space-y-3">
                      <Input
                        label="Nama Menu"
                        value={editMenuItem.name}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Deskripsi"
                        value={editMenuItem.description}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, description: e.target.value })}
                        required
                      />
                      <Input
                        label="Harga"
                        type="number"
                        value={editMenuItem.price}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, price: e.target.value })}
                        required
                      />
                      <Input
                        label="Stok"
                        type="number"
                        value={editMenuItem.stock}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, stock: e.target.value })}
                        required
                      />
                      <select
                        value={editMenuItem.category}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Dessert">Dessert</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editMenuItem.is_available}
                          onChange={(e) => setEditMenuItem({ ...editMenuItem, is_available: e.target.checked })}
                          className="rounded"
                        />
                        <label className="text-sm text-gray-700">Tersedia</label>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditMenuItemImage(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="sm">Simpan</Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenuItem(null)}
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-orange-600">{formatRupiah(item.price)}</span>
                        <span className="text-sm text-gray-600">Stok: {item.stock}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMenuItem(item.id);
                            setEditMenuItem({
                              name: item.name,
                              description: item.description,
                              price: item.price.toString(),
                              stock: item.stock.toString(),
                              category: item.category || 'Makanan',
                              is_available: item.is_available,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add Restaurant Modal */}
        {showAddRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tambah Restoran</h3>
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <Input
                  label="Nama Restoran"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  required
                />
                <Input
                  label="Tipe Masakan"
                  value={newRestaurant.cuisine_type}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                  required
                />
                <Input
                  label="Alamat"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewRestaurantImage(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1">Tambah</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddRestaurant(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Menu Modal */}
        {showAddMenu && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tambah Menu</h3>
              <form onSubmit={handleAddMenu} className="space-y-4">
                <Input
                  label="Nama Menu"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  required
                />
                <Input
                  label="Deskripsi"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  required
                />
                <Input
                  label="Harga"
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                  required
                />
                <Input
                  label="Stok"
                  type="number"
                  value={newMenuItem.stock}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, stock: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewMenuItemImage(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1">Tambah</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMenu(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
