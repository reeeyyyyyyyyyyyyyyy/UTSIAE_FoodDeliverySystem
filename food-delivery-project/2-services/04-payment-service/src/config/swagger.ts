import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// Tentukan di mana file rute Anda berada
const routePath = path.resolve(process.cwd(), 'src/routes/*.ts');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'API documentation for the Payment Service',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3004}`,
        description: 'Development server',
      },
    ],
  },
  // Path ke file API (routes) Anda
  apis: [routePath, path.resolve(process.cwd(), 'src/routes/payment.routes.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);