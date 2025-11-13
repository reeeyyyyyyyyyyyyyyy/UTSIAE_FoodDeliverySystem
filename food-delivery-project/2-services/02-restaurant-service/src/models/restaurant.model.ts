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
    try {
      const [rows] = await pool.execute('SELECT * FROM restaurants ORDER BY name ASC');
      const restaurants = rows as Restaurant[];
      // Remove duplicates by id (in case of any duplicates)
      const uniqueRestaurants = restaurants.filter((r, index, self) => 
        index === self.findIndex((rest) => rest.id === r.id)
      );
      return uniqueRestaurants;
    } catch (error: any) {
      console.error('Error in RestaurantModel.findAll:', error);
      throw error;
    }
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
    const restaurant = await this.findById(insertId);
    if (!restaurant) {
      throw new Error('Failed to create restaurant');
    }
    return restaurant;
  }

  static async update(id: number, restaurantData: Partial<{ name: string; cuisine_type: string; address: string; image_url?: string; is_open?: boolean }>): Promise<Restaurant | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (restaurantData.name) {
      updates.push('name = ?');
      values.push(restaurantData.name);
    }
    if (restaurantData.cuisine_type) {
      updates.push('cuisine_type = ?');
      values.push(restaurantData.cuisine_type);
    }
    if (restaurantData.address) {
      updates.push('address = ?');
      values.push(restaurantData.address);
    }
    if (restaurantData.image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(restaurantData.image_url);
    }
    if (restaurantData.is_open !== undefined) {
      updates.push('is_open = ?');
      values.push(restaurantData.is_open);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM restaurants WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
}

export class MenuItemModel {
  static async findByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category ASC, name ASC',
        [restaurantId]
      );
      const menuItems = rows as MenuItem[];
      // Remove duplicates by id (in case of any duplicates)
      const uniqueMenuItems = menuItems.filter((item, index, self) => 
        index === self.findIndex((m) => m.id === item.id)
      );
      return uniqueMenuItems;
    } catch (error: any) {
      console.error('Error in MenuItemModel.findByRestaurantId:', error);
      throw error;
    }
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
    const menuItem = await this.findById(insertId);
    if (!menuItem) {
      throw new Error('Failed to create menu item');
    }
    return menuItem;
  }

  static async update(id: number, menuItemData: Partial<{ name: string; description?: string; price: number; stock: number; category?: string; image_url?: string; is_available?: boolean }>): Promise<MenuItem | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (menuItemData.name) {
      updates.push('name = ?');
      values.push(menuItemData.name);
    }
    if (menuItemData.description !== undefined) {
      updates.push('description = ?');
      values.push(menuItemData.description);
    }
    if (menuItemData.price !== undefined) {
      updates.push('price = ?');
      values.push(menuItemData.price);
    }
    if (menuItemData.stock !== undefined) {
      updates.push('stock = ?');
      values.push(menuItemData.stock);
    }
    if (menuItemData.category) {
      updates.push('category = ?');
      values.push(menuItemData.category);
    }
    if (menuItemData.image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(menuItemData.image_url);
    }
    if (menuItemData.is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(menuItemData.is_available);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
}
