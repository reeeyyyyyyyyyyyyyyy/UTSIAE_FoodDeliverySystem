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
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    image_url: '',
  });
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Makanan',
    image_url: '',
  });

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
        setMenuItems(response.data.menu_items || []);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createRestaurant(newRestaurant);
      if (response.status === 'success') {
        await fetchRestaurants();
        setShowAddRestaurant(false);
        setNewRestaurant({ name: '', cuisine_type: '', address: '', image_url: '' });
        alert('Restaurant added successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add restaurant');
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert('Please select a restaurant first');
      return;
    }
    try {
      const response = await adminAPI.createMenuItem(selectedRestaurant, {
        name: newMenuItem.name,
        description: newMenuItem.description,
        price: parseFloat(newMenuItem.price),
        stock: parseInt(newMenuItem.stock),
        category: newMenuItem.category,
        image_url: newMenuItem.image_url,
      });
      if (response.status === 'success') {
        setShowAddMenu(false);
        setNewMenuItem({ name: '', description: '', price: '', stock: '', category: 'Makanan', image_url: '' });
        await fetchMenuItems(selectedRestaurant);
        alert('Menu item added successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleRestock = async (menuItemId: number, quantity: number) => {
    try {
      const response = await adminAPI.restockMenuItem(menuItemId, quantity);
      if (response.status === 'success') {
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
        alert(`Stock updated successfully! New stock: ${response.data.stock}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to restock');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurants Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Restaurants</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddRestaurant(!showAddRestaurant)}
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
                <Input
                  label="Image URL"
                  value={newRestaurant.image_url}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, image_url: e.target.value })}
                />
                <Button type="submit" variant="primary" size="sm">
                  Add Restaurant
                </Button>
              </motion.form>
            )}

            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRestaurant === restaurant.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
                      <p className="text-sm text-gray-500">{restaurant.address}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Items Section */}
          {selectedRestaurant && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Menu Items</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddMenu(!showAddMenu)}
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
                  <Input
                    label="Image URL"
                    value={newMenuItem.image_url}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Add Menu Item
                  </Button>
                </motion.form>
              )}

              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
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
                      <div className="flex gap-2">
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
                <p className="text-2xl font-bold text-green-600">
                  {restaurants.filter((r) => r.is_open).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

