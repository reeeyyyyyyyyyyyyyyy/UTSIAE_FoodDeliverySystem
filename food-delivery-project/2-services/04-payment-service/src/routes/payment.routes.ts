import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /simulate:
 *   post:
 *     summary: Simulate payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - payment_id
 *             properties:
 *               order_id:
 *                 type: integer
 *               payment_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Bad request
 */
router.post('/simulate', authenticateToken, PaymentController.simulatePayment);

// Internal routes
router.post('/internal/payments', PaymentController.createPayment);

export default router;

