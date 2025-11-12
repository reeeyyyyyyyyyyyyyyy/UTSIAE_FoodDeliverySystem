import pool from '../database/connection';

export interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  address: string;
  is_open: boolean;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_available: boolean;
  category?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemCheck {
  menu_item_id: number;
  quantity: number;
}

export class RestaurantModel {
  static async findAll(): Promise<Restaurant[]> {
    const [rows] = await pool.execute('SELECT DISTINCT * FROM restaurants ORDER BY name ASC');
    return rows as Restaurant[];
  }

  static async findById(id: number): Promise<Restaurant | null> {
    const [rows] = await pool.execute('SELECT * FROM restaurants WHERE id = ?', [id]);
    const restaurants = rows as Restaurant[];
    return restaurants.length > 0 ? restaurants[0] : null;
  }

  static async findByCuisineType(cuisineType: string): Promise<Restaurant[]> {
    const [rows] = await pool.execute('SELECT * FROM restaurants WHERE cuisine_type = ? AND is_open = TRUE ORDER BY name ASC', [cuisineType]);
    return rows as Restaurant[];
  }

  static async create(restaurantData: { name: string; cuisine_type: string; address: string; image_url?: string; is_open?: boolean }): Promise<Restaurant> {
    const [result] = await pool.execute(
      'INSERT INTO restaurants (name, cuisine_type, address, image_url, is_open) VALUES (?, ?, ?, ?, ?)',
      [restaurantData.name, restaurantData.cuisine_type, restaurantData.address, restaurantData.image_url || null, restaurantData.is_open !== undefined ? restaurantData.is_open : true]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId) as Promise<Restaurant>;
  }
}

export class MenuItemModel {
  static async findByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    const [rows] = await pool.execute(
      'SELECT DISTINCT * FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE ORDER BY name ASC',
      [restaurantId]
    );
    return rows as MenuItem[];
  }

  static async findById(id: number): Promise<MenuItem | null> {
    const [rows] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [id]);
    const menuItems = rows as MenuItem[];
    return menuItems.length > 0 ? menuItems[0] : null;
  }

  static async checkStock(items: MenuItemCheck[]): Promise<{ available: boolean; message?: string; item?: MenuItemCheck }> {
    for (const item of items) {
      const menuItem = await this.findById(item.menu_item_id);
      if (!menuItem) {
        return {
          available: false,
          message: `Menu item with ID ${item.menu_item_id} not found`,
          item,
        };
      }
      if (!menuItem.is_available) {
        return {
          available: false,
          message: `Menu item '${menuItem.name}' is not available`,
          item,
        };
      }
      if (menuItem.stock < item.quantity) {
        return {
          available: false,
          message: `Insufficient stock for '${menuItem.name}'. Available: ${menuItem.stock}, Requested: ${item.quantity}`,
          item,
        };
      }
    }
    return { available: true };
  }

  static async decreaseStock(items: MenuItemCheck[]): Promise<void> {
    for (const item of items) {
      await pool.execute('UPDATE menu_items SET stock = stock - ? WHERE id = ?', [item.quantity, item.menu_item_id]);
      // Check if stock becomes 0, mark as unavailable
      const [rows] = await pool.execute('SELECT stock FROM menu_items WHERE id = ?', [item.menu_item_id]);
      const menuItems = rows as MenuItem[];
      if (menuItems.length > 0 && menuItems[0].stock <= 0) {
        await pool.execute('UPDATE menu_items SET is_available = FALSE WHERE id = ?', [item.menu_item_id]);
      }
    }
  }

  static async increaseStock(menuItemId: number, quantity: number): Promise<void> {
    await pool.execute('UPDATE menu_items SET stock = stock + ?, is_available = TRUE WHERE id = ?', [quantity, menuItemId]);
  }

  static async create(menuItemData: { restaurant_id: number; name: string; description?: string; price: number; stock: number; category?: string; image_url?: string }): Promise<MenuItem> {
    const [result] = await pool.execute(
      'INSERT INTO menu_items (restaurant_id, name, description, price, stock, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        menuItemData.restaurant_id,
        menuItemData.name,
        menuItemData.description || null,
        menuItemData.price,
        menuItemData.stock,
        menuItemData.category || 'Makanan',
        menuItemData.image_url || null,
        menuItemData.stock > 0,
      ]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId) as Promise<MenuItem>;
  }
}

