import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /status:
 *   put:
 *     summary: Update driver status
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BUSY, OFFLINE]
 *     responses:
 *       200:
 *         description: Driver status updated
 *       400:
 *         description: Bad request
 */
router.put('/status', authenticateToken, DriverController.updateStatus);

// Internal routes
router.get('/internal/drivers/:id', DriverController.getInternalDriver);
router.post('/internal/drivers/assign', DriverController.assignDriver);

export default router;

