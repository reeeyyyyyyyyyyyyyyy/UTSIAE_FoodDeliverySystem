import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const resolvers = {
  Mutation: {
    register: async (
      _: any,
      { input }: { input: any },
      { jwtSecret }: { jwtSecret: string }
    ) => {
      const userRepository = getRepository(User);
      const { name, email, password, role } = input;

      // Check if user exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = userRepository.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      await userRepository.save(user);

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    },

    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      { jwtSecret }: { jwtSecret: string }
    ) => {
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    },
  },

  Query: {
    me: async (
      _: any,
      { token }: { token: string },
      { jwtSecret }: { jwtSecret: string }
    ) => {
      try {
        const userRepository = getRepository(User);
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await userRepository.findOne({ where: { id: decoded.id } });
        return user;
      } catch (error) {
        throw new Error('Invalid token');
      }
    },
  },
};

export default resolvers;