"use strict";

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "AnubisBoost API",
      version: "1.0.0",
      description: "AnubisBoost backend REST API documentation.",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid authentication token",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        NotFound: {
          description: "Resource not found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication and session management" },
      { name: "Users", description: "User management and profile" },
      { name: "Catalog", description: "Games, platforms, service types, and services" },
      { name: "Orders", description: "Order lifecycle management" },
      { name: "Credentials", description: "Game account credentials (per order)" },
      { name: "Contracts", description: "Service contracts and signatures" },
      { name: "Payments", description: "Payment records per order" },
      { name: "Chat", description: "Order chat messages" },
      { name: "Notifications", description: "User notifications" },
      { name: "Admin", description: "Admin dashboard, audit logs, bans" },
      { name: "Security", description: "Two-factor authentication, email, phone" },
      { name: "Upload", description: "File uploads" },
      { name: "FAQ", description: "Frequently asked questions" },
    ],
  },
  apis: ["./src/modules/**/*.routes.js"],
};

module.exports = swaggerJsdoc(options);
