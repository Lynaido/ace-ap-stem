import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import config from './environment';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ace AP STEM (AAS) API',
    version: '1.0.0',
    description: 'Backend API for Ace AP STEM educational platform',
    contact: {
      name: 'AAS Team',
      email: 'contact@aas-platform.com',
    },
  },
  servers: [
    {
      url: config.apiBaseUrl,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Error message',
              },
            },
          },
        },
      },
      Problem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          text: {
            type: 'string',
          },
          subject: {
            type: 'string',
            enum: ['mathematics', 'physics', 'chemistry', 'biology'],
          },
          status: {
            type: 'string',
            enum: ['received', 'queued', 'solved', 'failed'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './dist/routes/*.js', './dist/controllers/*.js'], // Path to the API docs
};

let swaggerSpec: any = null;

try {
  swaggerSpec = swaggerJsdoc(options);
} catch (error) {
  console.error('Error generating Swagger spec:', error);
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'AAS API',
      version: '1.0.0',
      description: 'API Documentation temporarily unavailable'
    },
    paths: {}
  };
}

export const setupSwagger = (app: Application): void => {
  try {
    // Swagger page
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AAS API Documentation',
    }));

    // Docs in JSON format
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }
};

export default swaggerSpec;
