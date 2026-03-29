"use strict";

const ApiError = require("../shared/ApiError");
const logger = require("pino")({ level: "error" });

function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details || undefined,
    });
  }

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, code: "DUPLICATE", message: "Resource already exists" });
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}

module.exports = errorHandler;
