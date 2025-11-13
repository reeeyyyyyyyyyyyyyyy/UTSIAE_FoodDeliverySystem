import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { restaurantAPI, adminAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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

export const AdminDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<number | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant);
    }
  }, [selectedRestaurant]);

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

  const fetchMenuItems = async (restaurantId: number) => {
    try {
      const response = await restaurantAPI.getRestaurantMenu(restaurantId);
      if (response.status === 'success') {
        const items = response.data.menu_items || [];
        // Remove duplicates based on id
        const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
        setMenuItems(uniqueItems);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        setSuccess('Restaurant added successfully!');
        await fetchRestaurants();
        setShowAddRestaurant(false);
        setNewRestaurant({ name: '', cuisine_type: '', address: '' });
        setNewRestaurantImage(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add restaurant');
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedRestaurant) {
      setError('Please select a restaurant first');
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
        setSuccess('Menu item added successfully!');
        setShowAddMenu(false);
        setNewMenuItem({ name: '', description: '', price: '', stock: '', category: 'Makanan' });
        setNewMenuItemImage(null);
        await fetchMenuItems(selectedRestaurant);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleRestock = async (menuItemId: number, quantity: number) => {
    setError('');
    setSuccess('');
    try {
      const response = await adminAPI.restockMenuItem(menuItemId, quantity);
      if (response.status === 'success') {
        setSuccess(`Stock updated successfully! New stock: ${response.data.stock}`);
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to restock');
    }
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant.id);
    setEditRestaurant({
      name: restaurant.name,
      cuisine_type: restaurant.cuisine_type,
      address: restaurant.address,
      is_open: restaurant.is_open,
    });
    setEditRestaurantImage(null);
    setError('');
    setSuccess('');
  };

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('name', editRestaurant.name);
      formData.append('cuisine_type', editRestaurant.cuisine_type);
      formData.append('address', editRestaurant.address);
      formData.append('is_open', editRestaurant.is_open.toString());
      if (editRestaurantImage) {
        formData.append('image', editRestaurantImage);
      }

      const response = await adminAPI.updateRestaurant(editingRestaurant, formData);
      if (response.status === 'success') {
        setSuccess('Restaurant updated successfully!');
        setEditingRestaurant(null);
        await fetchRestaurants();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update restaurant');
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item.id);
    setEditMenuItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock.toString(),
      category: item.category || 'Makanan',
      is_available: item.is_available,
    });
    setEditMenuItemImage(null);
    setError('');
    setSuccess('');
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    setError('');
    setSuccess('');
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

      const response = await adminAPI.updateMenuItem(editingMenuItem, formData);
      if (response.status === 'success') {
        setSuccess('Menu item updated successfully!');
        setEditingMenuItem(null);
        setEditMenuItem({ name: '', description: '', price: '', stock: '', category: 'Makanan', is_available: true });
        setEditMenuItemImage(null);
        // Refresh menu items immediately
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update menu item');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurants Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Restaurants</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowAddRestaurant(!showAddRestaurant);
                  setError('');
                  setSuccess('');
                }}
              >
                {showAddRestaurant ? 'Cancel' : 'Add Restaurant'}
              </Button>
            </div>

            {showAddRestaurant && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddRestaurant}
                className="mb-4 space-y-3 p-4 bg-gray-50 rounded-lg"
              >
                <Input
                  label="Name"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  required
                />
                <Input
                  label="Cuisine Type"
                  value={newRestaurant.cuisine_type}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                  required
                />
                <Input
                  label="Address"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewRestaurantImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  Add Restaurant
                </Button>
              </motion.form>
            )}

            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => {
                    setSelectedRestaurant(restaurant.id);
                    setError('');
                    setSuccess('');
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRestaurant === restaurant.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {restaurant.image_url && (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
                          <p className="text-sm text-gray-500">{restaurant.address}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {restaurant.is_open ? 'Open' : 'Closed'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRestaurant(restaurant);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {editingRestaurant === restaurant.id && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleUpdateRestaurant}
                      className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <Input
                        label="Name"
                        value={editRestaurant.name}
                        onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Cuisine Type"
                        value={editRestaurant.cuisine_type}
                        onChange={(e) => setEditRestaurant({ ...editRestaurant, cuisine_type: e.target.value })}
                        required
                      />
                      <Input
                        label="Address"
                        value={editRestaurant.address}
                        onChange={(e) => setEditRestaurant({ ...editRestaurant, address: e.target.value })}
                        required
                      />
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editRestaurant.is_open}
                            onChange={(e) => setEditRestaurant({ ...editRestaurant, is_open: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Is Open</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditRestaurantImage(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="sm">
                          Update
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRestaurant(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Menu Items Section */}
          {selectedRestaurant && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Menu Items - {restaurants.find((r) => r.id === selectedRestaurant)?.name}
                </h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowAddMenu(!showAddMenu);
                    setError('');
                    setSuccess('');
                  }}
                >
                  {showAddMenu ? 'Cancel' : 'Add Menu Item'}
                </Button>
              </div>

              {showAddMenu && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleAddMenu}
                  className="mb-4 space-y-3 p-4 bg-gray-50 rounded-lg"
                >
                  <Input
                    label="Name"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Description"
                    value={newMenuItem.description}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Price"
                      type="number"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                      required
                    />
                    <Input
                      label="Stock"
                      type="number"
                      value={newMenuItem.stock}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newMenuItem.category}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Makanan">Makanan</option>
                      <option value="Jajanan">Jajanan</option>
                      <option value="Add On">Add On</option>
                      <option value="Minuman">Minuman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewMenuItemImage(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    Add Menu Item
                  </Button>
                </motion.form>
              )}

              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex gap-4 items-start">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm text-gray-600">
                                Price: <span className="font-semibold">Rp {item.price.toLocaleString()}</span>
                              </span>
                              <span className="text-sm text-gray-600">
                                Stock: <span className="font-semibold">{item.stock}</span>
                              </span>
                              {item.category && (
                                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMenuItem(item)}
                        >
                          Edit
                        </Button>
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const quantity = parseInt((e.target as HTMLInputElement).value);
                              if (quantity > 0) {
                                handleRestock(item.id, quantity);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const quantity = parseInt(prompt('Enter restock quantity:') || '0');
                            if (quantity > 0) {
                              handleRestock(item.id, quantity);
                            }
                          }}
                        >
                          Restock
                        </Button>
                      </div>
                    </div>
                    {editingMenuItem === item.id && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={handleUpdateMenuItem}
                        className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg"
                      >
                        <Input
                          label="Name"
                          value={editMenuItem.name}
                          onChange={(e) => setEditMenuItem({ ...editMenuItem, name: e.target.value })}
                          required
                        />
                        <Input
                          label="Description"
                          value={editMenuItem.description}
                          onChange={(e) => setEditMenuItem({ ...editMenuItem, description: e.target.value })}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Price"
                            type="number"
                            value={editMenuItem.price}
                            onChange={(e) => setEditMenuItem({ ...editMenuItem, price: e.target.value })}
                            required
                          />
                          <Input
                            label="Stock"
                            type="number"
                            value={editMenuItem.stock}
                            onChange={(e) => setEditMenuItem({ ...editMenuItem, stock: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editMenuItem.category}
                            onChange={(e) => setEditMenuItem({ ...editMenuItem, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="Makanan">Makanan</option>
                            <option value="Jajanan">Jajanan</option>
                            <option value="Add On">Add On</option>
                            <option value="Minuman">Minuman</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editMenuItem.is_available}
                              onChange={(e) => setEditMenuItem({ ...editMenuItem, is_available: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Is Available</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditMenuItemImage(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" variant="primary" size="sm">
                            Update
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMenuItem(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.form>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Restaurants</p>
                <p className="text-2xl font-bold text-primary-600">{restaurants.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Menu Items</p>
                <p className="text-2xl font-bold text-primary-600">{menuItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Restaurants</p>
                <p className="text-2xl font-bold text-green-600">{restaurants.filter((r) => r.is_open).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
