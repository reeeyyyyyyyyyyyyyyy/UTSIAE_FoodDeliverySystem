import { AuthenticationError, UserInputError } from 'apollo-server-core';
import { UserModel, AddressModel } from '../../models/user.model';

export const queryResolvers = {
  Query: {
    health: () => 'User Service is healthy',

    getProfile: async (_parent: any, _args: any, context: any) => {
      try {
        const userId = context.user?.id;
        const userEmail = context.user?.email;

        if (!userId && !userEmail) {
          throw new AuthenticationError('Unauthorized');
        }

        let user = userId ? await UserModel.findById(userId) : null;

        if (!user && userEmail) {
          user = await UserModel.findByEmail(userEmail);
        }

        if (!user) {
          throw new UserInputError('User not found');
        }

        return {
          status: 'success',
          message: 'Profile retrieved successfully',
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to get profile: ${error.message}`);
      }
    },

    getAddresses: async (_parent: any, _args: any, context: any) => {
      try {
        const userId = context.user?.id;

        if (!userId) {
          throw new AuthenticationError('Unauthorized');
        }

        const addresses = await AddressModel.findByUserId(userId);

        return {
          status: 'success',
          data: addresses.map((addr: any) => ({
            id: addr.id,
            userId: addr.user_id,
            label: addr.label,
            fullAddress: addr.full_address,
            latitude: addr.latitude,
            longitude: addr.longitude,
            isDefault: addr.is_default,
            createdAt: addr.created_at,
            updatedAt: addr.updated_at,
          })),
        };
      } catch (error: any) {
        throw new Error(`Failed to get addresses: ${error.message}`);
      }
    },

    getAddress: async (_parent: any, args: { id: number }, context: any) => {
      try {
        const userId = context.user?.id;

        if (!userId) {
          throw new AuthenticationError('Unauthorized');
        }

        const address = await AddressModel.findById(args.id);

        if (!address || address.user_id !== userId) {
          throw new UserInputError('Address not found');
        }

        return {
          status: 'success',
          message: 'Address retrieved successfully',
          data: {
            id: address.id,
            userId: address.user_id,
            label: address.label,
            fullAddress: address.full_address,
            latitude: address.latitude,
            longitude: address.longitude,
            isDefault: address.is_default,
            createdAt: address.created_at,
            updatedAt: address.updated_at,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to get address: ${error.message}`);
      }
    },

    getAllUsers: async (_parent: any, args: { limit?: number; offset?: number }, _context: any) => {
      try {
        const limit = args.limit || 100;
        const offset = args.offset || 0;

        const users = await UserModel.findAll(limit, offset);

        return {
          status: 'success',
          data: users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          })),
        };
      } catch (error: any) {
        throw new Error(`Failed to get all users: ${error.message}`);
      }
    },

    getUserById: async (_parent: any, args: { id: number }, _context: any) => {
      try {
        const user = await UserModel.findById(args.id);

        if (!user) {
          throw new UserInputError('User not found');
        }

        return {
          status: 'success',
          message: 'User retrieved successfully',
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to get user: ${error.message}`);
      }
    },
  },
};
