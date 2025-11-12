import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateToken, authorizeDriver } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurant_id
 *               - address_id
 *               - items
 *             properties:
 *               restaurant_id:
 *                 type: integer
 *               address_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menu_item_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', authenticateToken, OrderController.createOrder);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get user orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/', authenticateToken, OrderController.getOrders);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticateToken, OrderController.getOrderById);

// Driver routes
router.get('/available', authenticateToken, authorizeDriver, OrderController.getAvailableOrders);
router.get('/driver/my-orders', authenticateToken, authorizeDriver, OrderController.getDriverOrders);
router.post('/:id/accept', authenticateToken, authorizeDriver, OrderController.acceptOrder);
router.post('/:id/complete', authenticateToken, authorizeDriver, OrderController.completeOrder);

// Internal routes
router.post('/internal/callback/payment', OrderController.paymentCallback);

export default router;

