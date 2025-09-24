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
            type: 'string',
            example: 'Error message',
          },
        },
      },
      Subject: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'ap_physics_1_2',
          },
          name: {
            type: 'string',
            example: 'AP Physics 1 & 2 (algebra-based)',
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['Kinematics', 'Dynamics', 'Energy'],
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
          title: {
            type: 'string',
            example: 'Solve for the velocity of the object',
          },
          description: {
            type: 'string',
            example: 'A 2kg object is dropped from 10m height...',
          },
          subject: {
            type: 'string',
            enum: [
              'ap_physics_1_2', 'ap_physics_c_mechanics', 'ap_physics_c_electricity_magnetism',
              'ap_chemistry', 'ap_biology', 'ap_computer_science_a', 'ap_computer_science_principles',
              'ap_precalculus', 'ap_calculus_bc', 'ap_calculus_ab', 'ap_statistics'
            ],
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['RECEIVED', 'QUEUED', 'SOLVED'],
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          assets: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProblemAsset',
            },
          },
        },
      },
      ProblemAsset: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          problemId: {
            type: 'string',
            format: 'uuid',
          },
          storageLocation: {
            type: 'string',
            enum: ['postgres', 's3'],
          },
          externalKey: {
            type: 'string',
            nullable: true,
          },
          externalUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          fileName: {
            type: 'string',
          },
          fileSize: {
            type: 'integer',
          },
          mimeType: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      UploadResult: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          url: {
            type: 'string',
            format: 'uri',
          },
          storageLocation: {
            type: 'string',
          },
          fileName: {
            type: 'string',
          },
          fileSize: {
            type: 'integer',
          },
          mimeType: {
            type: 'string',
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
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
          },
          limit: {
            type: 'integer',
            minimum: 1,
          },
          total: {
            type: 'integer',
            minimum: 0,
          },
          pages: {
            type: 'integer',
            minimum: 0,
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
