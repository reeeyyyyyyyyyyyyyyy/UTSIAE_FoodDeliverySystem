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

// Guard the swaggerJsdoc generation so a filesystem read error (ETIMEDOUT/ECANCELED)
// won't crash the service at startup. If generation fails, export a minimal spec.
let swaggerSpec: any = {};
try {
  swaggerSpec = swaggerJsdoc(options);
} catch (err: any) {
  // Log a warning and fallback to minimal spec
  console.warn('⚠️ Failed to generate swagger spec, falling back to minimal spec:', err && err.message ? err.message : err);
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API (partial)',
      version: '1.0.0',
      description: 'Fallback API documentation (generation failed at startup)'.toString(),
    },
    paths: {},
  };
}

export { swaggerSpec };