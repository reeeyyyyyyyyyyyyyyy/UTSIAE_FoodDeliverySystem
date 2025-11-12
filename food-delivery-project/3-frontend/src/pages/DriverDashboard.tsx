import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { driverAPI } from '../services/api';
import { Button } from '../components/ui/Button';

interface Order {
  order_id: number;
  restaurant_name: string;
  customer_name: string;
  customer_address: string;
  status: string;
  total_price: number;
  created_at: string;
  items: Array<{
    menu_item_name: string;
    quantity: number;
    price: number;
  }>;
}

const statusColors: { [key: string]: string } = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  ON_THE_WAY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
};

export const DriverDashboard: React.FC = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const availableResponse = await driverAPI.getAvailableOrders();
      const myOrdersResponse = await driverAPI.getMyOrders();

      if (availableResponse.status === 'success') {
        setAvailableOrders(availableResponse.data || []);
      }

      if (myOrdersResponse.status === 'success') {
        setMyOrders(myOrdersResponse.data || []);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const response = await driverAPI.acceptOrder(orderId);
      if (response.status === 'success') {
        await fetchOrders(); // Refresh orders
        alert('Order accepted successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const response = await driverAPI.completeOrder(orderId);
      if (response.status === 'success') {
        await fetchOrders(); // Refresh orders
        alert('Order completed successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete order');
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Driver Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Orders */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Available Orders
              {availableOrders.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {availableOrders.length} New
                </span>
              )}
            </h2>

            {availableOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No available orders</p>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">Order #{order.order_id}</h3>
                        <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {order.customer_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {order.customer_address}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total:</span>{' '}
                        <span className="font-bold text-primary-600">
                          Rp {order.total_price.toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {item.menu_item_name} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleAcceptOrder(order.order_id)}
                    >
                      Accept Order
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Orders */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Active Orders</h2>

            {myOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No active orders</p>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-primary-200 bg-primary-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">Order #{order.order_id}</h3>
                        <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {order.customer_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {order.customer_address}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total:</span>{' '}
                        <span className="font-bold text-primary-600">
                          Rp {order.total_price.toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCompleteOrder(order.order_id)}
                    >
                      Mark as Delivered
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

