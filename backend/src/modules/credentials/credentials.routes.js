"use strict";

const { Router } = require("express");
const svc = require("./credentials.service");
const Order = require("../../models/Order");
const User = require("../../models/User");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const auditLog = require("../../middleware/auditLog");
const ApiError = require("../../shared/ApiError");
const { strictLimiter } = require("../../middleware/rateLimiter");

const router = Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * /orders/{orderId}/credentials:
 *   post:
 *     tags: [Credentials]
 *     summary: Upload game account credentials (client)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               extra: { type: string }
 *     responses:
 *       201:
 *         description: Credentials uploaded
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/", authorize("credentials:upload"), async (req, res) => {
  const data = await svc.upload(req.params.orderId, req.user.id, req.body);

  const notifSvc = require("../notifications/notifications.service");
  const order = await Order.query().findById(req.params.orderId).select("id", "order_number", "client_id", "collaborator_id");
  if (order) {
    const recipients = new Set();
    if (order.collaborator_id) recipients.add(order.collaborator_id);
    const admins = await User.query().joinRelated("role").where("role.name", "admin").where("users.is_active", true).select("users.id");
    admins.forEach((a) => recipients.add(a.id));
    recipients.delete(req.user.id);
    for (const uid of recipients) {
      await notifSvc.create({ userId: uid, type: "order.credentials_uploaded", title: `🔐 Credenciales subidas - ${order.order_number}`, body: "El cliente ha subido las credenciales de su cuenta.", data: { orderId: order.id, orderNumber: order.order_number } });
    }
  }

  res.status(201).json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/credentials/request-code:
 *   post:
 *     tags: [Credentials]
 *     summary: Request verification code to view credentials
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent: { type: boolean }
 *                     destination: { type: string }
 *                     expiresIn: { type: integer, description: "Seconds until code expires" }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/request-code", authorize("credentials:view"), strictLimiter, async (req, res) => {
  const order = await Order.query().findById(req.params.orderId).select("status");
  if (!order) throw ApiError.notFound("Order not found");
  if (!["in_progress", "completed"].includes(order.status)) throw ApiError.forbidden("Credentials only accessible when in progress");

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await User.query().findById(req.user.id).patch({
    credential_view_code: code,
    credential_view_expires: expires,
  });

  const user = await User.query().findById(req.user.id).select("email", "phone", "two_factor_method");
  const mailer = require("../../shared/mailer");
  await mailer.sendCredentialViewCode(user.email, code);

  const dest = user.two_factor_method === "sms" && user.phone
    ? "***" + user.phone.slice(-4)
    : user.email.split("@")[0].slice(0, 2) + "***@" + user.email.split("@")[1];

  res.json({ success: true, data: { sent: true, destination: dest, expiresIn: 300 } });
});

/**
 * @swagger
 * /orders/{orderId}/credentials/view:
 *   post:
 *     tags: [Credentials]
 *     summary: View credentials with verification code
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, description: "6-digit verification code" }
 *     responses:
 *       200:
 *         description: Decrypted credentials (viewTTL in seconds)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *                 viewTTL: { type: integer, example: 120 }
 *       401:
 *         description: Invalid or expired verification code
 */
router.post("/view", authorize("credentials:view"), strictLimiter,
  auditLog("credentials.viewed", { entity: "order", idParam: "orderId" }),
  async (req, res) => {
    const order = await Order.query().findById(req.params.orderId).select("status");
    if (!order) throw ApiError.notFound("Order not found");
    if (!["in_progress", "completed"].includes(order.status)) throw ApiError.forbidden("Credentials only accessible when in progress");

    // Verify code
    const user = await User.query().findById(req.user.id).select("credential_view_code", "credential_view_expires");
    if (!user.credential_view_code || user.credential_view_code !== req.body.code) {
      throw ApiError.unauthorized("Invalid verification code");
    }
    if (new Date(user.credential_view_expires) < new Date()) {
      throw ApiError.unauthorized("Verification code expired");
    }

    // Clear code (one-time use)
    await User.query().findById(req.user.id).patch({ credential_view_code: null, credential_view_expires: null });

    const data = await svc.view(req.params.orderId);
    // Return with a TTL so frontend knows to hide after X seconds
    res.json({ success: true, data, viewTTL: 120 }); // visible for 2 minutes
  }
);

/**
 * @swagger
 * /orders/{orderId}/credentials/status:
 *   get:
 *     tags: [Credentials]
 *     summary: Check if credentials have been uploaded
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Upload status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploaded: { type: boolean }
 */
router.get("/status", authenticate, async (req, res) => {
  const exists = await svc.exists(req.params.orderId);
  res.json({ success: true, data: { uploaded: exists } });
});

/**
 * @swagger
 * /orders/{orderId}/credentials:
 *   delete:
 *     tags: [Credentials]
 *     summary: Delete credentials (admin)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Credentials deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete("/", authorize.role("admin"), auditLog("credentials.deleted", { entity: "order", idParam: "orderId" }), async (req, res) => {
  await svc.remove(req.params.orderId);
  res.json({ success: true });
});

module.exports = router;
