import { getRepository } from 'typeorm';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import { checkPaymentExternal } from '../services/paymentService';

const resolvers = {
  Query: {
    order: async (_: any, { id }: { id: string }) => {
      const orderRepository = getRepository(Order);
      return await orderRepository.findOne({
        where: { id },
        relations: ['items'],
      });
    },

    userOrders: async (_: any, { userId }: { userId: string }) => {
      const orderRepository = getRepository(Order);
      return await orderRepository.find({
        where: { userId },
        relations: ['items'],
      });
    },
  },

  Mutation: {
    createOrder: async (
      _: any,
      {
        input,
      }: {
        input: {
          userId: string;
          restaurantId: string;
          items: { menuId: string; quantity: number; price: number }[];
        };
      }
    ) => {
      const orderRepository = getRepository(Order);
      const orderItemRepository = getRepository(OrderItem);

      // Calculate total
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Check payment (mocked)
      const isPaymentSuccess = await checkPaymentExternal(totalAmount);

      // Create order
      const order = orderRepository.create({
        userId: input.userId,
        restaurantId: input.restaurantId,
        totalAmount,
        status: isPaymentSuccess ? 'PAID' : 'PENDING',
      });

      const savedOrder = await orderRepository.save(order);

      // Create order items
      for (const item of input.items) {
        const orderItem = orderItemRepository.create({
          orderId: savedOrder.id,
          menuId: item.menuId,
          quantity: item.quantity,
          price: item.price,
        });
        await orderItemRepository.save(orderItem);
      }

      return savedOrder;
    },
  },
};

export default resolvers;