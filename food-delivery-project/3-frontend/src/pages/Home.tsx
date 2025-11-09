import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { restaurantAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  address: string;
  is_open: boolean;
}

export const Home: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantAPI.getRestaurants(filter || undefined);
        if (response.status === 'success') {
          setRestaurants(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [filter]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const cuisineTypes = ['All', 'Padang', 'Sunda', 'Jawa', 'Western', 'Fast Food'];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading restaurants...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Food Delivery</h1>
            <p className="text-xl mb-6">Order your favorite food from the best restaurants</p>
            {!isAuthenticated && (
              <div className="flex gap-4 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/register')}
                  className="bg-white text-primary-600 hover:bg-gray-100"
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Login
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Browse Restaurants</h2>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setFilter(cuisine === 'All' ? '' : cuisine)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  filter === (cuisine === 'All' ? '' : cuisine)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurants Grid */}
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No restaurants found</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {restaurants.map((restaurant) => (
              <motion.div key={restaurant.id} variants={item}>
                <Card
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate(`/restaurants/${restaurant.id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="h-full cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {restaurant.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          restaurant.is_open
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {restaurant.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-primary-600 font-medium mb-2">
                      {restaurant.cuisine_type}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">{restaurant.address}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAuthenticated) {
                          navigate(`/restaurants/${restaurant.id}`);
                        } else {
                          navigate('/login');
                        }
                      }}
                    >
                      View Menu
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

