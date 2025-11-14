import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile/me', authenticateToken, UserController.getProfile);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user addresses
 *       401:
 *         description: Unauthorized
 */
router.get('/addresses', authenticateToken, UserController.getAddresses);

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - full_address
 *             properties:
 *               label:
 *                 type: string
 *               full_address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/addresses', authenticateToken, UserController.createAddress);
router.put('/addresses/:id', authenticateToken, UserController.updateAddress);
router.delete('/addresses/:id', authenticateToken, UserController.deleteAddress);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeAdmin, UserController.getAllUsers);
router.get('/admin/users/:id/purchases', authenticateToken, authorizeAdmin, UserController.getUserPurchaseHistory);

// Internal routes (no authentication required from gateway, but should be called from other services)
router.get('/internal/users/:id', UserController.getInternalUser);
router.get('/internal/addresses/:id', UserController.getInternalAddress);

export default router;

