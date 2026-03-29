"use strict";

class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Not authenticated") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Insufficient permissions") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message) {
    return new ApiError(409, "CONFLICT", message);
  }
  static validation(details) {
    return new ApiError(422, "VALIDATION_ERROR", "Validation failed", details);
  }
  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, "TOO_MANY_REQUESTS", message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

module.exports = ApiError;
