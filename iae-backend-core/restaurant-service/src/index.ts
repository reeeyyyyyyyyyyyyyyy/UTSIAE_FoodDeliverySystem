import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createConnection } from 'typeorm';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import Restaurant from './models/Restaurant';
import MenuItem from './models/MenuItem';

const startServer = async () => {
  try {
    // Initialize database
    await createConnection({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'restaurant_db',
      entities: [Restaurant, MenuItem],
      synchronize: true,
      logging: false,
    });

    console.log('✓ Database connected');

    // Initialize Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4002 },
    });
    console.log(`✓ Restaurant Service ready at ${url}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
