"use strict";

const { Router } = require("express");
const ctrl = require("./users.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const schema = require("./users.validator");

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/", authorize.role("admin"), ctrl.list);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (admin)
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
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: User created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/", authorize.role("admin"), validate(schema.createUser), ctrl.create);

/**
 * @swagger
 * /users/me/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get own profile
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get("/me/profile", ctrl.getProfile);

/**
 * @swagger
 * /users/me/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Update own profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch("/me/profile", validate(schema.updateProfile), ctrl.updateProfile);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change own password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 */
router.patch("/me/password", validate(schema.changePassword), ctrl.changePassword);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", authorize.role("admin"), ctrl.getById);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               username: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch("/:id", authorize.role("admin"), validate(schema.updateUser), ctrl.update);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Change user role (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [client, collaborator, admin] }
 *     responses:
 *       200:
 *         description: Role changed
 */
router.patch("/:id/role", authorize.role("admin"), ctrl.changeRole);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user active status (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/:id/status", authorize.role("admin"), ctrl.toggleStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete user (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/:id", authorize.role("admin"), ctrl.remove);

module.exports = router;
