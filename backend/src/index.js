"use strict";

require("express-async-errors");
require("./db/knex");
const http = require("http");
const express = require("express");
const { Server: SocketIOServer } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const pino = require("pino");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const ApiError = require("./shared/ApiError");
const authenticate = require("./middleware/authenticate");
const authorize = require("./middleware/authorize");

// Routes
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");
const catalogRoutes = require("./modules/catalog/catalog.routes");
const orderRoutes = require("./modules/orders/orders.routes");
const credentialRoutes = require("./modules/credentials/credentials.routes");
const { contractRouter, policiesRouter } = require("./modules/contracts/contracts.routes");
const paymentRoutes = require("./modules/payments/payments.routes");
const chatRoutes = require("./modules/chat/chat.routes");
const notificationRoutes = require("./modules/notifications/notifications.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const uploadRoutes = require("./modules/upload/upload.routes");
const faqRoutes = require("./modules/faq/faq.routes");
const securityRoutes = require("./modules/security/security.routes");
const path = require("path");

// Socket
const { setupChatNamespace } = require("./modules/chat/chat.gateway");
const { setIO: setNotificationIO } = require("./modules/notifications/notifications.service");
const { verifyAccessToken } = require("./shared/jwt");

const PORT = parseInt(process.env.APP_PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const logger = pino({ level: isProd ? "info" : "debug", transport: isProd ? undefined : { target: "pino-pretty" } });

const app = express();
const server = http.createServer(app);

// Global middleware
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  } : false,
}));
app.use(cors({ origin: isProd ? process.env.FRONTEND_URL : true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!isProd) app.use(morgan("dev"));
app.use(apiLimiter);

// Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'none'; img-src 'self'");
  },
}));

// API Docs - Scalar (modern Stripe-like UI)
const { apiReference } = require("@scalar/express-api-reference");

// Serve the OpenAPI spec JSON (needed by Scalar)
app.get("/api/docs/openapi.json", (req, res, next) => {
  if (req.query.token && !req.headers.authorization) req.headers.authorization = `Bearer ${req.query.token}`;
  next();
}, authenticate, authorize.role("admin"), (_req, res) => {
  res.json(swaggerSpec);
});

// Scalar UI (admin only, token via query param)
app.use("/api/docs", (req, res, next) => {
  if (req.query.token && !req.headers.authorization) req.headers.authorization = `Bearer ${req.query.token}`;
  // Let static assets through without auth
  if (req.path !== "/" && req.path !== "") return next();
  authenticate(req, res, (err) => {
    if (err) return next(err);
    authorize.role("admin")(req, res, next);
  });
}, (req, res, next) => {
  // Pass token to spec URL so Scalar can fetch it
  const token = req.query.token || "";
  const specUrl = `/api/docs/openapi.json?token=${token}`;
  apiReference({
    spec: { url: specUrl },
    theme: "purple",
    layout: "modern",
    darkMode: true,
    metaData: { title: "AnubisBoost API" },
    hideDownloadButton: false,
  })(req, res, next);
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: NODE_ENV, uptime: Math.floor(process.uptime()) });
});

// API v1 routes
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/catalog", catalogRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/orders/:orderId/credentials", credentialRoutes);
app.use("/api/v1/orders/:orderId/contract", contractRouter);
app.use("/api/v1/orders/:orderId/payments", paymentRoutes);
app.use("/api/v1/orders/:orderId/chat", chatRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/contract-policies", policiesRouter);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/security", securityRoutes);

// 404 + Error handler
app.use((_req, _res, next) => next(ApiError.notFound("Route not found")));
app.use(errorHandler);

// Socket.io
const io = new SocketIOServer(server, {
  cors: isProd ? {} : { origin: "*" },
  transports: ["websocket", "polling"],
});

// Notification namespace
const notifNs = io.of("/notifications");
notifNs.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Auth required"));
  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch { next(new Error("Invalid token")); }
});
notifNs.on("connection", (socket) => {
  socket.join(`user:${socket.data.user.userId}`);
});

setNotificationIO(io);
setupChatNamespace(io);

// Start
async function start() {
  try {
    const knex = require("./db/knex");
    await knex.raw("SELECT 1");
    logger.info("MySQL connected");
  } catch (err) {
    logger.error({ err }, "MySQL connection failed — will retry via pool");
  }

  try {
    const { connectRedis } = require("./db/redis");
    await connectRedis();
    logger.info("Redis connected");
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { getRedisClient } = require("./db/redis");
    const pubClient = getRedisClient();
    const subClient = pubClient.duplicate();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.io Redis adapter ready");
  } catch (err) {
    logger.warn({ err }, "Redis failed — running without adapter");
  }

  server.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT, env: NODE_ENV }, "AnubisBoost API started");
  });
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    logger.info({ signal }, "Shutting down...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  });
}

start().catch((err) => { logger.fatal({ err }, "Failed to start"); process.exit(1); });
