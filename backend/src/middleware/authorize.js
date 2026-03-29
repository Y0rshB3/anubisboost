"use strict";

const ApiError = require("../shared/ApiError");

function authorize(permission) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.user.permissions.includes(permission)) throw ApiError.forbidden();
    next();
  };
}

authorize.role = function (...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden(`Requires role: ${roles.join(", ")}`);
    next();
  };
};

module.exports = authorize;
