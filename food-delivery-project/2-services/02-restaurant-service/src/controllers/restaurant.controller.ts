import { Request, Response } from 'express';
import { RestaurantModel, MenuItemModel, MenuItemCheck } from '../models/restaurant.model';

export class RestaurantController {
  static async getRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const { cuisine_type } = req.query;

      let restaurants;
      if (cuisine_type) {
        restaurants = await RestaurantModel.findByCuisineType(cuisine_type as string);
      } else {
        restaurants = await RestaurantModel.findAll();
      }

      res.json({
        status: 'success',
        data: restaurants.map((r) => ({
          id: r.id,
          name: r.name,
          cuisine_type: r.cuisine_type,
          address: r.address,
          is_open: r.is_open,
        })),
      });
    } catch (error: any) {
      console.error('Get restaurants error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async getRestaurantMenu(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.id);

      if (!restaurantId) {
        res.status(400).json({
          status: 'error',
          message: 'Restaurant ID is required',
        });
        return;
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({
          status: 'error',
          message: 'Restaurant not found',
        });
        return;
      }

      const menuItems = await MenuItemModel.findByRestaurantId(restaurantId);

      res.json({
        status: 'success',
        data: {
          restaurant_name: restaurant.name,
          menu_items: menuItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stock,
            is_available: item.is_available,
          })),
        },
      });
    } catch (error: any) {
      console.error('Get restaurant menu error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Internal endpoints for other services
  static async checkMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        res.status(400).json({
          status: 'error',
          message: 'Items array is required',
        });
        return;
      }

      const menuItemChecks: MenuItemCheck[] = items.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      const checkResult = await MenuItemModel.checkStock(menuItemChecks);

      if (!checkResult.available) {
        res.status(400).json({
          status: 'error',
          message: checkResult.message || 'Stock check failed',
        });
        return;
      }

      res.json({
        status: 'success',
        message: 'Stock is available',
      });
    } catch (error: any) {
      console.error('Check menu items error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async decreaseStock(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        res.status(400).json({
          status: 'error',
          message: 'Items array is required',
        });
        return;
      }

      const menuItemChecks: MenuItemCheck[] = items.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      // First check stock
      const checkResult = await MenuItemModel.checkStock(menuItemChecks);
      if (!checkResult.available) {
        res.status(400).json({
          status: 'error',
          message: checkResult.message || 'Stock check failed',
        });
        return;
      }

      // Decrease stock
      await MenuItemModel.decreaseStock(menuItemChecks);

      res.json({
        status: 'success',
        message: 'Stock decreased successfully',
      });
    } catch (error: any) {
      console.error('Decrease stock error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

