import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// Tentukan di mana file rute Anda berada
const routePath = path.resolve(process.cwd(), 'src/routes/*.ts');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Service API',
      version: '1.0.0',
      description: 'API documentation for the Restaurant Service',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
        description: 'Development server',
      },
    ],
  },
  // Path ke file API (routes) Anda
  apis: [routePath, path.resolve(process.cwd(), 'src/routes/restaurant.routes.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);