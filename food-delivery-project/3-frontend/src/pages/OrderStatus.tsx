import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import { Button } from '../components/ui/Button';

interface OrderStatus {
  order_id: number;
  status: string;
  restaurant_details: {
    name: string;
    address: string;
  };
  delivery_address: string;
  driver_details: {
    name: string;
    phone: string;
    vehicle: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_price: number;
  estimated_delivery: string | null;
}

const statusSteps = [
  { key: 'PENDING_PAYMENT', label: 'Order Placed', icon: '📝' },
  { key: 'PAID', label: 'Payment Success', icon: '✅' },
  { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ON_THE_WAY', label: 'On The Way', icon: '🚗' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

const statusColors: { [key: string]: string } = {
  PENDING_PAYMENT: 'bg-yellow-500',
  PAID: 'bg-blue-500',
  PREPARING: 'bg-orange-500',
  ON_THE_WAY: 'bg-purple-500',
  DELIVERED: 'bg-green-500',
};

export const OrderStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderAPI.getOrderById(parseInt(id!));
        if (response.status === 'success') {
          setOrder(response.data);
          setError('');
        } else {
          setError('Failed to load order details');
        }
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        setError(error.response?.data?.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusSteps.findIndex((step) => step.key === order.status);
    return index >= 0 ? index : 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Button variant="primary" onClick={() => navigate('/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">Order not found</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/orders')}
          className="text-primary-600 hover:text-primary-700 mb-6 flex items-center"
        >
          ← Back to Orders
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Order #{order.order_id}</h1>
              <p className="text-gray-600">
                Placed on {new Date().toLocaleString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                statusColors[order.status] || 'bg-gray-500'
              } text-white`}
            >
              {statusSteps.find(s => s.key === order.status)?.label || order.status}
            </span>
          </div>

          {/* Status Stepper */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0">
                <motion.div
                  className={`h-full ${statusColors[order.status] || 'bg-gray-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: index === currentStepIndex ? 1.2 : 1,
                      backgroundColor: index <= currentStepIndex 
                        ? (statusColors[order.status] || '#6b7280')
                        : '#e5e7eb',
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-lg ${
                      index === currentStepIndex ? 'ring-4 ring-primary-200' : ''
                    }`}
                  >
                    <span className="text-xl">{step.icon}</span>
                  </motion.div>
                  <span
                    className={`text-sm font-medium text-center max-w-[80px] ${
                      index <= currentStepIndex ? 'text-gray-800' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Restaurant</h3>
                <p className="text-gray-800">{order.restaurant_details.name}</p>
                <p className="text-gray-600 text-sm">{order.restaurant_details.address}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Delivery Address</h3>
                <p className="text-gray-800">{order.delivery_address}</p>
              </div>
            </div>

            <div className="space-y-4">
              {order.driver_details && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Driver</h3>
                  <p className="text-gray-800">Name: {order.driver_details.name}</p>
                  <p className="text-gray-800">Phone: {order.driver_details.phone}</p>
                  <p className="text-gray-800">Vehicle: {order.driver_details.vehicle}</p>
                </div>
              )}

              {order.estimated_delivery && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Estimated Delivery</h3>
                  <p className="text-gray-800">
                    {new Date(order.estimated_delivery).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="text-gray-800 font-semibold">
                  Rp {(item.price * item.quantity).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total Price</span>
            <span className="text-2xl font-bold text-primary-600">
              Rp {order.total_price.toLocaleString()}
            </span>
          </div>
        </motion.div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/orders')} className="flex-1">
            View All Orders
          </Button>
          <Button variant="primary" onClick={() => navigate('/')} className="flex-1">
            Order Again
          </Button>
        </div>
      </div>
    </div>
  );
};
