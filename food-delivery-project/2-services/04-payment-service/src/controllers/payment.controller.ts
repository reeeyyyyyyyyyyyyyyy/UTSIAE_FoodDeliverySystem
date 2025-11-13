import { Request, Response } from 'express';
import { PaymentModel, PaymentInput } from '../models/payment.model';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export class PaymentController {
  static async simulatePayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const { order_id, payment_id, payment_method } = req.body;

      if (!order_id || !payment_id) {
        res.status(400).json({
          status: 'error',
          message: 'order_id and payment_id are required',
        });
        return;
      }

      // Update payment status to SUCCESS
      const payment = await PaymentModel.findById(payment_id);
      if (!payment) {
        res.status(404).json({
          status: 'error',
          message: 'Payment not found',
        });
        return;
      }

      if (payment.user_id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      // Update payment status
      await PaymentModel.updateStatus(payment_id, 'SUCCESS');

      // SOA: Payment Service calls Order Service internal callback endpoint
      // Path: /orders/internal/callback/payment (because orderRoutes is mounted at /orders)
      try {
        await axios.post(`${ORDER_SERVICE_URL}/orders/internal/callback/payment`, {
          order_id,
          payment_status: 'SUCCESS',
        }, {
          timeout: 5000,
        });
      } catch (error: any) {
        console.error('Failed to notify order service:', error.message);
        // Don't fail the request if webhook fails
      }

      res.json({
        status: 'success',
        message: 'Payment successful',
        data: {
          payment_id: payment.id,
          order_id: payment.order_id,
          status: 'SUCCESS',
        },
      });
    } catch (error: any) {
      console.error('Simulate payment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoint for order service
  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, user_id, amount } = req.body;

      if (!order_id || !user_id || !amount) {
        res.status(400).json({
          status: 'error',
          message: 'order_id, user_id, and amount are required',
        });
        return;
      }

      const paymentData: PaymentInput = {
        order_id,
        user_id,
        amount,
      };

      const payment = await PaymentModel.create(paymentData);

      res.status(201).json({
        status: 'success',
        data: {
          payment_id: payment.id,
          order_id: payment.order_id,
          amount: payment.amount,
          status: payment.status,
        },
      });
    } catch (error: any) {
      console.error('Create payment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

