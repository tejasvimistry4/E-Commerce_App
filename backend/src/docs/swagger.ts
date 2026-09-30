import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.3",

  info: {
    title: "E-Commerce APIs",
    version: "1.0.0",
    description:
      "REST API for an Amazon-inspired e-commerce application with Category Management",
  },

  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Auth",
      description: "Authentication and user authorization APIs",
    },
    {
      name: "Categories",
      description: "Category and subcategory catalog & management APIs",
    },
    {
      name: "Products",
      description: "Product management and catalog APIs",
    },
    {
      name: "Cart",
      description: "Shopping cart APIs",
    },
    {
      name: "Orders",
      description: "Order management APIs",
    },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token to access secured endpoints",
      },
    },

    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            example: "John Doe",
            minLength: 2,
            maxLength: 50,
          },
          email: {
            type: "string",
            format: "email",
            example: "john@gmail.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "john@123",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@gmail.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "john@123",
          },
        },
      },

      GoogleAuthRequest: {
        type: "object",
        required: ["idToken"],
        properties: {
          idToken: {
            type: "string",
            description: "Google ID Token / Credential issued by Google Identity Services",
            example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
          },
        },
      },

      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          name: {
            type: "string",
            example: "John Doe",
          },
          email: {
            type: "string",
            example: "john@gmail.com",
          },
          role: {
            type: "string",
            enum: ["USER", "SUPER_ADMIN"],
            example: "USER",
          },
          avatar: {
            type: "string",
            nullable: true,
            example: "https://lh3.googleusercontent.com/a/...",
          },
          googleId: {
            type: "string",
            nullable: true,
            example: "109827364519283746",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Category: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          },
          name: {
            type: "string",
            example: "Electronics",
          },
          slug: {
            type: "string",
            example: "electronics",
          },
          description: {
            type: "string",
            nullable: true,
            example: "Gadgets, devices, and accessories",
          },
          image: {
            type: "string",
            nullable: true,
            example: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
          },
          isActive: {
            type: "boolean",
            example: true,
          },
          parentId: {
            type: "string",
            nullable: true,
            format: "uuid",
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      CreateCategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            example: "Smartphones",
          },
          slug: {
            type: "string",
            example: "smartphones",
          },
          description: {
            type: "string",
            example: "Latest iOS and Android devices",
          },
          image: {
            type: "string",
            example: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
          },
          isActive: {
            type: "boolean",
            default: true,
            example: true,
          },
          parentId: {
            type: "string",
            format: "uuid",
            nullable: true,
            example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          },
        },
      },

      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            example: "Flagship Smartphones",
          },
          slug: {
            type: "string",
            example: "flagship-smartphones",
          },
          description: {
            type: "string",
            example: "Premium flagship devices",
          },
          image: {
            type: "string",
            example: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
          },
          isActive: {
            type: "boolean",
            example: true,
          },
          parentId: {
            type: "string",
            format: "uuid",
            nullable: true,
          },
        },
      },

      AuthResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Login successful",
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/User",
              },
              token: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
            },
          },
        },
      },

      UserProfileResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Profile fetched successfully",
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/User",
              },
            },
          },
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Something went wrong",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Please provide a valid email address" },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);