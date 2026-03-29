"use strict";

const { Router } = require("express");
const knex = require("../../db/knex");
const AuditLog = require("../../models/AuditLog");
const User = require("../../models/User");
const Ban = require("../../models/Ban");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { paginate } = require("../../shared/paginate");
const { signAccessToken } = require("../../shared/jwt");

const router = Router();
router.use(authenticate, authorize.role("admin"));

/**
 * @swagger
 * /admin/stats/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard stats (orders, revenue, users, collaborators)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_orders: { type: integer }
 *                     pending: { type: integer }
 *                     in_progress: { type: integer }
 *                     completed: { type: integer }
 *                     cancelled: { type: integer }
 *                     total_revenue: { type: number }
 *                     total_users: { type: integer }
 *                     active_collaborators: { type: integer }
 */
router.get("/stats/dashboard", async (_req, res) => {
  const totals = await knex("orders")
    .whereNull("deleted_at")
    .select(
      knex.raw("COUNT(*) AS total_orders"),
      knex.raw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending"),
      knex.raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress"),
      knex.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed"),
      knex.raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled")
    )
    .first();

  const revenue = await knex("payments")
    .select(knex.raw("COALESCE(SUM(amount), 0) AS total_revenue"))
    .first();

  const users = await knex("users")
    .whereNull("deleted_at")
    .count("* as total_users")
    .first();

  const collabs = await knex("users")
    .join("roles", "users.role_id", "roles.id")
    .where("roles.name", "collaborator")
    .where("users.is_active", true)
    .whereNull("users.deleted_at")
    .count("* as active_collaborators")
    .first();

  res.json({
    success: true,
    data: {
      ...totals,
      total_revenue: revenue.total_revenue,
      total_users: users.total_users,
      active_collaborators: collabs.active_collaborators,
    },
  });
});

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List audit logs
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action type
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get("/audit-logs", async (req, res) => {
  const { action, user_id } = req.query;

  const query = AuditLog.query()
    .alias("al")
    .select("al.*", "u.username")
    .leftJoin("users as u", "al.user_id", "u.id")
    .orderBy("al.created_at", "desc");

  if (action) query.where("al.action", action);
  if (user_id) query.where("al.user_id", user_id);

  const result = await paginate(query, req.query.page, req.query.limit);
  res.json({ success: true, ...result });
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with filters
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by email, username, or IP
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get("/users", async (req, res) => {
  const { search, role, status } = req.query;
  const query = User.query()
    .alias("u")
    .joinRelated("role")
    .select("u.id", "u.email", "u.username", "u.is_active", "u.email_verified",
      "u.two_factor_enabled", "u.last_login_at", "u.last_login_ip", "u.created_at",
      "role.name as role")
    .whereNull("u.deleted_at")
    .orderBy("u.created_at", "desc");

  if (search) query.where(qb => { qb.where("u.email", "like", `%${search}%`).orWhere("u.username", "like", `%${search}%`).orWhere("u.last_login_ip", "like", `%${search}%`); });
  if (role) query.where("role.name", role);
  if (status === "active") query.where("u.is_active", true);
  if (status === "inactive") query.where("u.is_active", false);

  const result = await paginate(query, req.query.page, req.query.limit);
  res.json({ success: true, ...result });
});

// ─── Bans ────────────────────────────────────────────────

/**
 * @swagger
 * /admin/bans:
 *   get:
 *     tags: [Admin]
 *     summary: List all bans
 *     responses:
 *       200:
 *         description: List of bans
 */
router.get("/bans", async (req, res) => {
  const bans = await Ban.query()
    .select("bans.*", "u.username as banned_by_name")
    .join("users as u", "bans.banned_by", "u.id")
    .orderBy("bans.created_at", "desc");
  res.json({ success: true, data: bans });
});

/**
 * @swagger
 * /admin/bans:
 *   post:
 *     tags: [Admin]
 *     summary: Create a ban
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ban_type, ban_value]
 *             properties:
 *               ban_type: { type: string, enum: [email, ip] }
 *               ban_value: { type: string }
 *               reason: { type: string }
 *               expires_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Ban created
 */
router.post("/bans", async (req, res) => {
  const ban = await Ban.query().insert({
    ban_type: req.body.ban_type,
    ban_value: req.body.ban_value,
    reason: req.body.reason || null,
    banned_by: req.user.id,
    expires_at: req.body.expires_at || null,
  });
  res.status(201).json({ success: true, data: ban });
});

/**
 * @swagger
 * /admin/bans/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Deactivate a ban
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ban deactivated
 */
router.delete("/bans/:id", async (req, res) => {
  await Ban.query().findById(req.params.id).patch({ is_active: false });
  res.json({ success: true });
});

/**
 * @swagger
 * /admin/users/{id}/ban:
 *   post:
 *     tags: [Admin]
 *     summary: Ban a user (email + IP + deactivate)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *               expires_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: User banned
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/users/:id/ban", async (req, res) => {
  const user = await User.query().findById(req.params.id).select("email", "last_login_ip");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // Ban email
  await Ban.query().insert({ ban_type: "email", ban_value: user.email, reason: req.body.reason || "Banned by admin", banned_by: req.user.id, expires_at: req.body.expires_at || null }).catch(() => {});
  // Ban IP if available
  if (user.last_login_ip) {
    await Ban.query().insert({ ban_type: "ip", ban_value: user.last_login_ip, reason: req.body.reason || "Banned by admin", banned_by: req.user.id, expires_at: req.body.expires_at || null }).catch(() => {});
  }
  // Deactivate user
  await User.query().findById(req.params.id).patch({ is_active: false });

  res.json({ success: true, message: "User banned" });
});

/**
 * @swagger
 * /admin/users/{id}/unban:
 *   post:
 *     tags: [Admin]
 *     summary: Unban a user (remove bans + reactivate)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User unbanned
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/users/:id/unban", async (req, res) => {
  const user = await User.query().findById(req.params.id).select("email", "last_login_ip");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  await Ban.query().where({ ban_type: "email", ban_value: user.email }).patch({ is_active: false });
  if (user.last_login_ip) await Ban.query().where({ ban_type: "ip", ban_value: user.last_login_ip }).patch({ is_active: false });
  await User.query().findById(req.params.id).patch({ is_active: true });

  res.json({ success: true, message: "User unbanned" });
});

/**
 * @swagger
 * /admin/docs-token:
 *   get:
 *     tags: [Admin]
 *     summary: Generate a short-lived token for Swagger UI access
 *     responses:
 *       200:
 *         description: Token for accessing /api/docs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     url: { type: string }
 *                     expiresIn: { type: integer, description: "Token TTL in seconds" }
 */
router.get("/docs-token", async (req, res) => {
  const token = signAccessToken({ userId: req.user.id, role: req.user.role });
  res.json({
    success: true,
    data: {
      token,
      url: `/api/docs?token=${token}`,
      expiresIn: 900, // 15 min (matches access token TTL)
    },
  });
});

module.exports = router;
