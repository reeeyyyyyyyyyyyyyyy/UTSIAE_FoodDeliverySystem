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

      // Remove duplicates by id
      const uniqueRestaurants = restaurants.filter((r, index, self) => 
        index === self.findIndex((rest) => rest.id === r.id)
      );

      res.json({
        status: 'success',
        data: uniqueRestaurants.map((r) => ({
          id: r.id,
          name: r.name,
          cuisine_type: r.cuisine_type,
          address: r.address,
          is_open: r.is_open,
          image_url: r.image_url,
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

      // Remove duplicates by id
      const uniqueMenuItems = menuItems.filter((item, index, self) => 
        index === self.findIndex((m) => m.id === item.id)
      );

      res.json({
        status: 'success',
        data: {
          restaurant_name: restaurant.name,
          menu_items: uniqueMenuItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stock,
            is_available: item.is_available,
            category: item.category || 'Makanan',
            image_url: item.image_url,
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

  // Admin endpoints
  static async createRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const { name, cuisine_type, address, is_open } = req.body;
      const file = (req as any).file;

      if (!name || !cuisine_type || !address) {
        res.status(400).json({
          status: 'error',
          message: 'Name, cuisine_type, and address are required',
        });
        return;
      }

      // Get image URL from uploaded file or use provided URL
      let image_url: string | undefined;
      if (file) {
        // File uploaded, use the file path
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        image_url = `${baseUrl}/uploads/${file.filename}`;
      } else if (req.body.image_url) {
        // URL provided
        image_url = req.body.image_url;
      }

      const restaurant = await RestaurantModel.create({
        name,
        cuisine_type,
        address,
        image_url,
        is_open: is_open !== undefined ? (is_open === 'true' || is_open === true) : true,
      });

      res.status(201).json({
        status: 'success',
        message: 'Restaurant created successfully',
        data: {
          id: restaurant.id,
          name: restaurant.name,
          cuisine_type: restaurant.cuisine_type,
          address: restaurant.address,
          is_open: restaurant.is_open,
          image_url: restaurant.image_url,
        },
      });
    } catch (error: any) {
      console.error('Create restaurant error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.id);
      const { name, description, price, stock, category } = req.body;
      const file = (req as any).file;

      if (!restaurantId) {
        res.status(400).json({
          status: 'error',
          message: 'Restaurant ID is required',
        });
        return;
      }

      if (!name || !price || stock === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'Name, price, and stock are required',
        });
        return;
      }

      // Get image URL from uploaded file or use provided URL
      let image_url: string | undefined;
      if (file) {
        // File uploaded, use the file path
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        image_url = `${baseUrl}/uploads/${file.filename}`;
      } else if (req.body.image_url) {
        // URL provided
        image_url = req.body.image_url;
      }

      // Check if restaurant exists
      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({
          status: 'error',
          message: 'Restaurant not found',
        });
        return;
      }

      const menuItem = await MenuItemModel.create({
        restaurant_id: restaurantId,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || 'Makanan',
        image_url,
      });

      res.status(201).json({
        status: 'success',
        message: 'Menu item created successfully',
        data: {
          id: menuItem.id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          stock: menuItem.stock,
          category: menuItem.category,
          image_url: menuItem.image_url,
          is_available: menuItem.is_available,
        },
      });
    } catch (error: any) {
      console.error('Create menu item error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async updateRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.id);
      const { name, cuisine_type, address, is_open } = req.body;
      const file = (req as any).file;

      if (!restaurantId) {
        res.status(400).json({
          status: 'error',
          message: 'Restaurant ID is required',
        });
        return;
      }

      // Get image URL from uploaded file or use provided URL
      let image_url: string | undefined;
      if (file) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        image_url = `${baseUrl}/uploads/${file.filename}`;
      } else if (req.body.image_url) {
        image_url = req.body.image_url;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (cuisine_type) updateData.cuisine_type = cuisine_type;
      if (address) updateData.address = address;
      if (is_open !== undefined) updateData.is_open = is_open === 'true' || is_open === true;
      if (image_url !== undefined) updateData.image_url = image_url;

      const restaurant = await RestaurantModel.update(restaurantId, updateData);

      res.json({
        status: 'success',
        message: 'Restaurant updated successfully',
        data: restaurant,
      });
    } catch (error: any) {
      console.error('Update restaurant error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.id);
      const { name, description, price, stock, category, is_available } = req.body;
      const file = (req as any).file;

      if (!menuItemId) {
        res.status(400).json({
          status: 'error',
          message: 'Menu item ID is required',
        });
        return;
      }

      // Get image URL from uploaded file or use provided URL
      let image_url: string | undefined;
      if (file) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        image_url = `${baseUrl}/uploads/${file.filename}`;
      } else if (req.body.image_url) {
        image_url = req.body.image_url;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (category) updateData.category = category;
      if (is_available !== undefined) updateData.is_available = is_available === 'true' || is_available === true;
      if (image_url !== undefined) updateData.image_url = image_url;

      const menuItem = await MenuItemModel.update(menuItemId, updateData);

      res.json({
        status: 'success',
        message: 'Menu item updated successfully',
        data: menuItem,
      });
    } catch (error: any) {
      console.error('Update menu item error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async restockMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!menuItemId) {
        res.status(400).json({
          status: 'error',
          message: 'Menu item ID is required',
        });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid quantity is required',
        });
        return;
      }

      // Check if menu item exists
      const menuItem = await MenuItemModel.findById(menuItemId);
      if (!menuItem) {
        res.status(404).json({
          status: 'error',
          message: 'Menu item not found',
        });
        return;
      }

      await MenuItemModel.increaseStock(menuItemId, parseInt(quantity));

      // Get updated menu item
      const updatedMenuItem = await MenuItemModel.findById(menuItemId);

      res.json({
        status: 'success',
        message: 'Stock updated successfully',
        data: {
          id: updatedMenuItem!.id,
          name: updatedMenuItem!.name,
          stock: updatedMenuItem!.stock,
          is_available: updatedMenuItem!.is_available,
        },
      });
    } catch (error: any) {
      console.error('Restock menu item error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  static async setMenuItemAvailability(req: Request, res: Response): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.id);
      const { is_available } = req.body;

      if (!menuItemId) {
        res.status(400).json({
          status: 'error',
          message: 'Menu item ID is required',
        });
        return;
      }

      if (is_available === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'is_available is required',
        });
        return;
      }

      // Check if menu item exists
      const menuItem = await MenuItemModel.findById(menuItemId);
      if (!menuItem) {
        res.status(404).json({
          status: 'error',
          message: 'Menu item not found',
        });
        return;
      }

      await MenuItemModel.update(menuItemId, { is_available: Boolean(is_available) });

      // Get updated menu item
      const updatedMenuItem = await MenuItemModel.findById(menuItemId);

      res.json({
        status: 'success',
        message: 'Menu item availability updated successfully',
        data: {
          id: updatedMenuItem!.id,
          name: updatedMenuItem!.name,
          is_available: updatedMenuItem!.is_available,
        },
      });
    } catch (error: any) {
      console.error('Set menu item availability error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

