import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticateToken, authorizeDriver } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/admin/all', authenticateToken, authorizeAdmin, DriverController.getAllDrivers);
router.get('/admin/salaries', authenticateToken, authorizeAdmin, DriverController.getDriverSalaries);
router.post('/admin/salaries', authenticateToken, authorizeAdmin, DriverController.createDriverSalary);
router.put('/admin/salaries/:id/status', authenticateToken, authorizeAdmin, DriverController.updateSalaryStatus);

// Driver profile routes
router.get('/profile', authenticateToken, authorizeDriver, DriverController.getDriverProfile);
router.put('/profile', authenticateToken, authorizeDriver, DriverController.updateDriverProfile);

// Internal routes
router.get('/internal/drivers/by-user/:userId', DriverController.getDriverByUserId);
router.get('/internal/drivers/:id', DriverController.getDriverById);

export default router;
