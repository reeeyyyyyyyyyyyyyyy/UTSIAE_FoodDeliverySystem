import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { AuthenticationError, UserInputError } from 'apollo-server-core';
import dotenv from 'dotenv';
import { UserModel, AddressModel } from '../../models/user.model';

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const mutationResolvers = {
  Mutation: {
    register: async (
      _parent: any,
      args: {
        input: {
          name: string;
          email: string;
          password: string;
          phone?: string;
        };
      },
      _context: any
    ) => {
      try {
        const { name, email, password, phone } = args.input;

        // Validation
        if (!name || !email || !password) {
          throw new UserInputError('Name, email, and password are required');
        }

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          throw new UserInputError('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userData: any = {
          name,
          email,
          password: hashedPassword,
          phone,
        };

        const user = await UserModel.create(userData);

        console.log(`[${new Date().toISOString()}] User registered: ${email}`);

        return {
          status: 'success',
          message: 'User registered successfully',
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
        console.error('Register error:', error);
        throw new Error(`Registration failed: ${error.message}`);
      }
    },

    login: async (
      _parent: any,
      args: {
        input: {
          email: string;
          password: string;
        };
      },
      _context: any
    ) => {
      try {
        const { email, password } = args.input;

        // Validation
        if (!email || !password) {
          throw new UserInputError('Email and password are required');
        }

        // Find user
        const user = await UserModel.findByEmail(email);
        if (!user) {
          throw new AuthenticationError('Invalid credentials');
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password!);
        if (!validPassword) {
          throw new AuthenticationError('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
        );

        console.log(`[${new Date().toISOString()}] Login successful for: ${email}`);

        return {
          status: 'success',
          message: 'Login successful',
          data: {
            token,
          },
        };
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(`Login failed: ${error.message}`);
      }
    },

    createAddress: async (
      _parent: any,
      args: {
        input: {
          label: string;
          fullAddress: string;
          latitude?: number;
          longitude?: number;
          isDefault?: boolean;
        };
      },
      context: any
    ) => {
      try {
        const userId = context.user?.id;

        if (!userId) {
          throw new AuthenticationError('Unauthorized');
        }

        const { label, fullAddress, latitude, longitude, isDefault } = args.input;

        if (!label || !fullAddress) {
          throw new UserInputError('Label and fullAddress are required');
        }

        const addressData: any = {
          label,
          full_address: fullAddress,
          latitude,
          longitude,
          is_default: isDefault,
        };

        const address = await AddressModel.create(userId, addressData);

        return {
          status: 'success',
          message: 'Address created successfully',
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
        throw new Error(`Failed to create address: ${error.message}`);
      }
    },

    updateAddress: async (
      _parent: any,
      args: {
        id: number;
        input: {
          label?: string;
          fullAddress?: string;
          latitude?: number;
          longitude?: number;
          isDefault?: boolean;
        };
      },
      context: any
    ) => {
      try {
        const userId = context.user?.id;

        if (!userId) {
          throw new AuthenticationError('Unauthorized');
        }

        const address = await AddressModel.findById(args.id);

        if (!address || address.user_id !== userId) {
          throw new UserInputError('Address not found');
        }

        const updateData: any = {};
        if (args.input.label) updateData.label = args.input.label;
        if (args.input.fullAddress) updateData.full_address = args.input.fullAddress;
        if (args.input.latitude !== undefined) updateData.latitude = args.input.latitude;
        if (args.input.longitude !== undefined) updateData.longitude = args.input.longitude;
        if (args.input.isDefault !== undefined) updateData.is_default = args.input.isDefault;

        const updatedAddress = await AddressModel.update(args.id, userId, updateData);

        if (!updatedAddress) {
          throw new Error('Failed to update address');
        }

        return {
          status: 'success',
          message: 'Address updated successfully',
          data: {
            id: updatedAddress.id,
            userId: updatedAddress.user_id,
            label: updatedAddress.label,
            fullAddress: updatedAddress.full_address,
            latitude: updatedAddress.latitude,
            longitude: updatedAddress.longitude,
            isDefault: updatedAddress.is_default,
            createdAt: updatedAddress.created_at,
            updatedAt: updatedAddress.updated_at,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to update address: ${error.message}`);
      }
    },

    deleteAddress: async (
      _parent: any,
      args: { id: number },
      context: any
    ) => {
      try {
        const userId = context.user?.id;

        if (!userId) {
          throw new AuthenticationError('Unauthorized');
        }

        const address = await AddressModel.findById(args.id);

        if (!address || address.user_id !== userId) {
          throw new UserInputError('Address not found');
        }

        const deleted = await AddressModel.delete(args.id, userId);

        if (!deleted) {
          throw new Error('Failed to delete address');
        }

        return 'Address deleted successfully';
      } catch (error: any) {
        throw new Error(`Failed to delete address: ${error.message}`);
      }
    },
  },
};
