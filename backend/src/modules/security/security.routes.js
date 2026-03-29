"use strict";

const { Router } = require("express");
const svc = require("./security.service");
const authenticate = require("../../middleware/authenticate");
const { strictLimiter } = require("../../middleware/rateLimiter");

const router = Router();
router.use(authenticate);

// ─── 2FA ─────────────────────────────────────────────────

/**
 * @swagger
 * /security/2fa/enable:
 *   post:
 *     tags: [Security]
 *     summary: Enable two-factor authentication
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method: { type: string, enum: [email, sms], default: email }
 *     responses:
 *       200:
 *         description: 2FA enabled
 */
router.post("/2fa/enable", async (req, res) => {
  const data = await svc.enable2FA(req.user.id, req.body.method || "email");
  res.json({ success: true, data });
});

/**
 * @swagger
 * /security/2fa/disable:
 *   post:
 *     tags: [Security]
 *     summary: Disable two-factor authentication
 *     responses:
 *       200:
 *         description: 2FA disabled
 */
router.post("/2fa/disable", async (req, res) => {
  const data = await svc.disable2FA(req.user.id);
  res.json({ success: true, data });
});

/**
 * @swagger
 * /security/2fa/send:
 *   post:
 *     tags: [Security]
 *     summary: Send a 2FA verification code
 *     responses:
 *       200:
 *         description: Code sent
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/2fa/send", strictLimiter, async (req, res) => {
  const data = await svc.send2FACode(req.user.id);
  res.json({ success: true, data });
});

/**
 * @swagger
 * /security/2fa/verify:
 *   post:
 *     tags: [Security]
 *     summary: Verify a 2FA code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Code verified
 *       401:
 *         description: Invalid code
 */
router.post("/2fa/verify", strictLimiter, async (req, res) => {
  const data = await svc.verify2FACode(req.user.id, req.body.code);
  res.json({ success: true, data });
});

// ─── Email change ────────────────────────────────────────

/**
 * @swagger
 * /security/email/request:
 *   post:
 *     tags: [Security]
 *     summary: Request email change
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Verification code sent to new email
 */
router.post("/email/request", async (req, res) => {
  const data = await svc.requestEmailChange(req.user.id, req.body.email);
  res.json({ success: true, data });
});

/**
 * @swagger
 * /security/email/confirm:
 *   post:
 *     tags: [Security]
 *     summary: Confirm email change with code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Email changed
 *       401:
 *         description: Invalid code
 */
router.post("/email/confirm", strictLimiter, async (req, res) => {
  const data = await svc.confirmEmailChange(req.user.id, req.body.code);
  res.json({ success: true, data });
});

// ─── Phone ───────────────────────────────────────────────

/**
 * @swagger
 * /security/phone:
 *   patch:
 *     tags: [Security]
 *     summary: Update phone number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Phone updated
 */
router.patch("/phone", async (req, res) => {
  const data = await svc.updatePhone(req.user.id, req.body.phone);
  res.json({ success: true, data });
});

// ─── Status ──────────────────────────────────────────────

/**
 * @swagger
 * /security/status:
 *   get:
 *     tags: [Security]
 *     summary: Get current security settings
 *     responses:
 *       200:
 *         description: Security status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     two_factor_enabled: { type: boolean }
 *                     two_factor_method: { type: string }
 *                     phone: { type: string }
 *                     email: { type: string }
 *                     email_verified: { type: boolean }
 */
router.get("/status", async (req, res) => {
  const User = require("../../models/User");
  const user = await User.query().findById(req.user.id)
    .select("two_factor_enabled", "two_factor_method", "phone", "email", "email_verified");
  res.json({ success: true, data: user });
});

module.exports = router;
