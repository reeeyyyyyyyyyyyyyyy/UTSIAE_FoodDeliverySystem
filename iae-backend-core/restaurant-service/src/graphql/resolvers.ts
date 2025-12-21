// RESTAURANT SERVICE - /Users/rayyyhann/Documents/apalah/UTSIAE_FoodDeliverySystem/iae-backend-core/restaurant-service/src/graphql/resolvers.ts
import { getRepository } from 'typeorm';
import Restaurant from '../models/Restaurant';
import MenuItem from '../models/MenuItem';

const resolvers = {
  Query: {
    restaurants: async () => {
      const restaurantRepository = getRepository(Restaurant);
      return await restaurantRepository.find({ relations: ['menus'] });
    },

    restaurant: async (_: any, { id }: { id: string }) => {
      const restaurantRepository = getRepository(Restaurant);
      return await restaurantRepository.findOne({
        where: { id },
        relations: ['menus'],
      });
    },

    menu: async (_: any, { restaurantId }: { restaurantId: string }) => {
      const menuRepository = getRepository(MenuItem);
      return await menuRepository.find({ where: { restaurantId } });
    },
  },

  Mutation: {
    createRestaurant: async (
      _: any,
      { input }: { input: { name: string; address: string; description?: string } }
    ) => {
      const restaurantRepository = getRepository(Restaurant);
      const restaurant = restaurantRepository.create(input);
      return await restaurantRepository.save(restaurant);
    },

    createMenuItem: async (
      _: any,
      { input }: { input: { name: string; price: number; description?: string; restaurantId: string } }
    ) => {
      const menuRepository = getRepository(MenuItem);
      const menu = menuRepository.create(input);
      return await menuRepository.save(menu);
    },
  },
};

export default resolvers;