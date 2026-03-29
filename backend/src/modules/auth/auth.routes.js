"use strict";

const { Router } = require("express");
const ctrl = require("./auth.controller");
const validate = require("../../middleware/validate");
const schema = require("./auth.validator");
const authenticate = require("../../middleware/authenticate");
const { authLimiter } = require("../../middleware/rateLimiter");
const checkBan = require("../../middleware/checkBan");

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email: { type: string, format: email }
 *               username: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/register", authLimiter, checkBan, validate(schema.register), ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful (or requires 2FA)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     requires2FA: { type: boolean }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/login", authLimiter, checkBan, validate(schema.login), ctrl.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     description: Uses refresh token from cookie or request body.
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/refresh", authLimiter, ctrl.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate session
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/logout", authenticate, ctrl.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     security: []
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
 *         description: Reset email sent (always returns 200 to prevent enumeration)
 */
router.post("/forgot-password", authLimiter, validate(schema.forgotPassword), ctrl.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password", authLimiter, validate(schema.resetPassword), ctrl.resetPassword);

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     tags: [Auth]
 *     summary: Verify two-factor authentication code
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, tempToken]
 *             properties:
 *               code: { type: string }
 *               tempToken: { type: string }
 *     responses:
 *       200:
 *         description: 2FA verified, tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/verify-2fa", authLimiter, ctrl.verify2FA);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", authenticate, ctrl.me);

module.exports = router;
