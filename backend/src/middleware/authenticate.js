"use strict";

const { verifyAccessToken } = require("../shared/jwt");
const User = require("../models/User");
const ApiError = require("../shared/ApiError");

async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.access_token;

  if (!token) throw ApiError.unauthorized();

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.query()
    .findById(decoded.userId)
    .whereNull("deleted_at")
    .select("id", "role_id", "email", "username", "is_active")
    .withGraphFetched("[role.permissions]")
    .modifyGraph("role", (b) => b.select("id", "name"))
    .modifyGraph("role.permissions", (b) => b.select("name"));

  if (!user || !user.is_active) throw ApiError.unauthorized("Account disabled or not found");

  const permissionNames = (user.role?.permissions || []).map((p) => p.name);

  req.user = {
    id: user.id,
    role_id: user.role_id,
    email: user.email,
    username: user.username,
    is_active: user.is_active,
    role: user.role?.name,
    permissions: permissionNames,
  };
  next();
}

module.exports = authenticate;
