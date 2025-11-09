import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Order {
  order_id: number;
  restaurant_name: string;
  status: string;
  total_price: number;
  created_at: string;
}

const statusColors: { [key: string]: string } = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  ON_THE_WAY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getOrders();
        if (response.status === 'success') {
          setOrders(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING_PAYMENT: 'Pending Payment',
      PAID: 'Paid',
      PREPARING: 'Preparing',
      ON_THE_WAY: 'On The Way',
      DELIVERED: 'Delivered',
      PAYMENT_FAILED: 'Payment Failed',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          Browse Restaurants
        </Button>
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-gray-600 text-lg mb-4">No orders yet</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Start Ordering
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {orders.map((order, index) => (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => navigate(`/orders/${order.order_id}`)}
                className="h-full cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order #{order.order_id}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Restaurant:</span> {order.restaurant_name}
                  </p>
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Total:</span>{' '}
                    <span className="text-primary-600 font-bold">
                      Rp {order.total_price.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

