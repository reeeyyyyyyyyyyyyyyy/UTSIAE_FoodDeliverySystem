import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

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
router.post('/', authenticateToken, authorizeAdmin, upload.single('image'), RestaurantController.createRestaurant);
router.put('/:id', authenticateToken, authorizeAdmin, upload.single('image'), RestaurantController.updateRestaurant);
router.delete('/:id', authenticateToken, authorizeAdmin, RestaurantController.deleteRestaurant);
router.post('/:id/menu', authenticateToken, authorizeAdmin, upload.single('image'), RestaurantController.createMenuItem);
router.put('/menu-items/:id', authenticateToken, authorizeAdmin, upload.single('image'), RestaurantController.updateMenuItem);
router.delete('/menu-items/:id', authenticateToken, authorizeAdmin, RestaurantController.deleteMenuItem);
router.put('/menu-items/:id/stock', authenticateToken, authorizeAdmin, RestaurantController.restockMenuItem);
router.put('/menu-items/:id/availability', authenticateToken, authorizeAdmin, RestaurantController.setMenuItemAvailability);

// Internal routes
router.post('/internal/menu-items/check', RestaurantController.checkMenuItems);
router.post('/internal/menu-items/decrease-stock', RestaurantController.decreaseStock);

export default router;

