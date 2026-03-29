"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/User");
const Role = require("../../models/Role");
const RefreshToken = require("../../models/RefreshToken");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../shared/jwt");
const ApiError = require("../../shared/ApiError");
const { ROLES } = require("../../shared/constants");

async function register({ email, username, password }) {
  const hash = await bcrypt.hash(password, 12);
  const role = await Role.query().findOne({ name: ROLES.CLIENT });
  const roleId = role?.id || 3;

  const user = await User.query().insert({
    role_id: roleId,
    email,
    username,
    password_hash: hash,
  });

  return generateTokens(user.id, email);
}

async function login({ email, password, ip, userAgent }) {
  const user = await User.query()
    .findOne({ email })
    .whereNull("deleted_at")
    .withGraphFetched("role");

  if (!user) throw ApiError.unauthorized("Invalid credentials");
  if (!user.is_active) throw ApiError.unauthorized("Account is disabled");
  if (!user.password_hash) throw ApiError.unauthorized("Use Google login for this account");

  // Check lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw ApiError.tooManyRequests(`Account locked. Try again in ${mins} minute(s).`);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const count = (user.failed_login_count || 0) + 1;
    const patch = { failed_login_count: count };
    if (count >= 5) {
      patch.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      patch.failed_login_count = 0;
    }
    await User.query().findById(user.id).patch(patch);
    throw ApiError.unauthorized("Invalid credentials");
  }

  await User.query().findById(user.id).patch({
    failed_login_count: 0,
    locked_until: null,
    last_login_at: new Date(),
    last_login_ip: ip,
  });

  // Check 2FA
  if (user.two_factor_enabled) {
    const securityService = require("../security/security.service");
    const result = await securityService.send2FACode(user.id);
    return { requires2FA: true, userId: user.id, ...result };
  }

  return generateTokens(user.id, user.email);
}

async function verify2FALogin(userId, code) {
  const securityService = require("../security/security.service");
  await securityService.verify2FACode(userId, code);
  const user = await User.query().findById(userId).select("email");
  return generateTokens(userId, user.email);
}

async function generateTokens(userId, email) {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken({ userId });

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.query().insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const token = await RefreshToken.query()
    .findOne({ token_hash: tokenHash })
    .whereNull("revoked_at")
    .where("expires_at", ">", new Date());

  if (!token) throw ApiError.unauthorized("Refresh token revoked or expired");

  // Rotate: revoke old, issue new
  await RefreshToken.query().findById(token.id).patch({ revoked_at: new Date() });

  const user = await User.query().findById(decoded.userId).select("email");
  return generateTokens(decoded.userId, user?.email);
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.query().findOne({ token_hash: tokenHash }).patch({ revoked_at: new Date() });
}

async function forgotPassword(email) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  await User.query()
    .patch({ password_reset_token: tokenHash, password_reset_expires: expires })
    .where({ email })
    .whereNull("deleted_at");
  return token;
}

async function resetPassword(token, newPassword) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.query()
    .findOne({ password_reset_token: tokenHash })
    .where("password_reset_expires", ">", new Date());

  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  const hash = await bcrypt.hash(newPassword, 12);
  await User.query().findById(user.id).patch({
    password_hash: hash,
    password_reset_token: null,
    password_reset_expires: null,
  });
}

async function getProfile(userId) {
  const user = await User.query()
    .findById(userId)
    .whereNull("deleted_at")
    .select("id", "email", "username", "avatar_url", "is_active", "email_verified", "created_at")
    .withGraphFetched("role")
    .modifyGraph("role", (builder) => builder.select("name"));

  if (!user) throw ApiError.notFound("User not found");

  // Flatten role to match old response shape: { ...user, role: "client" }
  const { role, ...rest } = user;
  return { ...rest, role: role?.name };
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, getProfile, verify2FALogin };
