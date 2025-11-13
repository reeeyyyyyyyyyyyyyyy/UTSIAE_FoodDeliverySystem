import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI, paymentAPI, restaurantAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';

interface OrderItem {
  menu_item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  restaurant_name: string;
  customer_name: string;
  customer_address: string;
  status: string;
  total_price: number;
  items: OrderItem[];
  created_at: string;
}

interface Payment {
  payment_id: number;
  order_id: number;
  amount: number;
  status: string;
}

export const Payment: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('E-Wallet');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const orderResponse = await orderAPI.getOrderById(parseInt(orderId!));
      if (orderResponse.status === 'success') {
        setOrder(orderResponse.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch order details');
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId || !paymentId) {
      setError('Order ID or Payment ID is missing');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await paymentAPI.simulatePayment({
        order_id: parseInt(orderId),
        payment_id: parseInt(paymentId),
        payment_method: paymentMethod,
      });

      if (response.status === 'success') {
        // Redirect to invoice/receipt page
        navigate(`/invoice/${orderId}`);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to process payment');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  // Calculate from order items (backend already includes tax and delivery fee in total_price)
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const deliveryFee = 10000; // Fixed delivery fee
  // Use backend total_price to ensure consistency (it already includes tax + delivery fee)
  const total = order.total_price || (subtotal + tax + deliveryFee);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment Confirmation</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Restaurant</p>
                <p className="font-semibold text-gray-800">{order.restaurant_name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-semibold text-gray-800">{order.customer_address}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold text-gray-800">#{order.order_id}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{item.menu_item_name || item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatRupiah(item.price)}</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatRupiah(deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="E-Wallet"
                  checked={paymentMethod === 'E-Wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">E-Wallet</span>
              </label>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Bank Transfer"
                  checked={paymentMethod === 'Bank Transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">Bank Transfer</span>
              </label>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">Cash on Delivery</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

