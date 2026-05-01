import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nexus Platform API',
    version: '1.0.0',
    description: 'Complete API documentation for Nexus - Investor & Entrepreneur Collaboration Platform',
    contact: {
      name: 'Support',
      email: 'support@nexus.com',
    },
  },
  servers: [
    { url: process.env.API_URL || 'http://localhost:5000', description: 'Development server' },
    { url: process.env.PROD_API_URL || 'https://api.nexus.com', description: 'Production server' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['entrepreneur', 'investor'] },
          bio: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Meeting: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] },
          roomId: { type: 'string' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          type: { type: 'string', enum: ['deposit', 'withdraw', 'transfer'] },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['entrepreneur', 'investor'] },
                },
                required: ['name', 'email', 'password', 'role'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/meetings': {
      post: {
        tags: ['Meetings'],
        summary: 'Create a new meeting',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  participantId: { type: 'string' },
                  title: { type: 'string' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  meetingType: { type: 'string' },
                },
                required: ['participantId', 'title', 'startTime', 'endTime'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Meeting created' },
        },
      },
    },
    '/api/payments/deposit': {
      post: {
        tags: ['Payments'],
        summary: 'Deposit funds to wallet',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', minimum: 10 },
                  paymentMethodId: { type: 'string' },
                },
                required: ['amount', 'paymentMethodId'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Deposit initiated' },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [], // if using JSDoc comments, specify paths here
};

export const setupSwagger = (app) => {
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    swaggerOptions: { persistAuthorization: true },
  }));
};