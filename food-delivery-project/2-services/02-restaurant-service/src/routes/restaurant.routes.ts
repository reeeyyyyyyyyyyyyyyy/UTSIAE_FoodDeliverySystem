import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurant]
 *     parameters:
 *       - in: query
 *         name: cuisine_type
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.get('/', RestaurantController.getRestaurants);

/**
 * @swagger
 * /{id}/menu:
 *   get:
 *     summary: Get restaurant menu
 *     tags: [Restaurant]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant menu
 *       404:
 *         description: Restaurant not found
 */
router.get('/:id/menu', RestaurantController.getRestaurantMenu);

// Admin routes (require authentication and admin role)
router.post('/', authenticateToken, authorizeAdmin, RestaurantController.createRestaurant);
router.post('/:id/menu', authenticateToken, authorizeAdmin, RestaurantController.createMenuItem);
router.put('/menu-items/:id/stock', authenticateToken, authorizeAdmin, RestaurantController.restockMenuItem);

// Internal routes
router.post('/internal/menu-items/check', RestaurantController.checkMenuItems);
router.post('/internal/menu-items/decrease-stock', RestaurantController.decreaseStock);

export default router;

