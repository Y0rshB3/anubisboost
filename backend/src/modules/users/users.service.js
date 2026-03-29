"use strict";

const bcrypt = require("bcryptjs");
const { escapeLike } = require("../../shared/escapeLike");
const User = require("../../models/User");
const ApiError = require("../../shared/ApiError");
const { paginate } = require("../../shared/paginate");

/**
 * Helper to fetch a single user with the role name flattened.
 * Matches the old response shape: { id, email, username, ..., role: "admin" }
 */
async function fetchUserById(id) {
  const user = await User.query()
    .findById(id)
    .whereNull("deleted_at")
    .select(
      "id", "email", "username", "avatar_url", "is_active",
      "email_verified", "created_at", "last_login_at"
    )
    .withGraphFetched("role")
    .modifyGraph("role", (b) => b.select("name"));

  if (!user) throw ApiError.notFound("User not found");
  const { role, ...rest } = user;
  return { ...rest, role: role?.name };
}

async function list({ page, limit, search, role }) {
  const query = User.query()
    .alias("u")
    .joinRelated("role")
    .select(
      "u.id", "u.email", "u.username", "u.avatar_url",
      "u.is_active", "u.email_verified", "u.created_at",
      "role.name as role"
    )
    .whereNull("u.deleted_at")
    .orderBy("u.created_at", "desc");

  if (search) {
    query.where((qb) => {
      const s = escapeLike(search);
      qb.where("u.email", "like", `%${s}%`)
        .orWhere("u.username", "like", `%${s}%`);
    });
  }
  if (role) {
    query.where("role.name", role);
  }

  return paginate(query, page, limit);
}

async function getById(id) {
  return fetchUserById(id);
}

async function create({ email, username, password, role_id }) {
  const hash = await bcrypt.hash(password, 12);
  const user = await User.query().insert({
    role_id,
    email,
    username,
    password_hash: hash,
    email_verified: true,
  });
  return fetchUserById(user.id);
}

async function update(id, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = v;
  }
  if (!Object.keys(fields).length) return fetchUserById(id);

  await User.query()
    .findById(id)
    .whereNull("deleted_at")
    .patch(fields);

  return fetchUserById(id);
}

async function changeRole(id, roleId) {
  await User.query().findById(id).patch({ role_id: roleId });
  return fetchUserById(id);
}

async function toggleStatus(id, isActive) {
  await User.query().findById(id).patch({ is_active: isActive });
  return fetchUserById(id);
}

async function softDelete(id) {
  await User.query().findById(id).patch({ deleted_at: new Date() });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.query().findById(userId).select("password_hash");
  if (!user) throw ApiError.notFound();
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");
  const hash = await bcrypt.hash(newPassword, 12);
  await User.query().findById(userId).patch({ password_hash: hash });

  // Revoke all refresh tokens to force re-login on all devices
  const RefreshToken = require("../../models/RefreshToken");
  await RefreshToken.query().where("user_id", userId).whereNull("revoked_at").patch({ revoked_at: new Date() });
}

module.exports = { list, getById, create, update, changeRole, toggleStatus, softDelete, changePassword };
