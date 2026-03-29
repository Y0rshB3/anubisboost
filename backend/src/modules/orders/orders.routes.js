"use strict";

const { Router } = require("express");
const ctrl = require("./orders.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     description: Returns orders visible to the current user (filtered by role).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated order list
 */
router.get("/", ctrl.list);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order (client)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_id]
 *             properties:
 *               service_id: { type: integer }
 *               details: { type: object }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Order created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/", authorize.role("client"), ctrl.create);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", ctrl.getById);

/**
 * @swagger
 * /orders/{id}/history:
 *   get:
 *     tags: [Orders]
 *     summary: Get order status history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Status transition history
 */
router.get("/:id/history", ctrl.history);

/**
 * @swagger
 * /orders/{id}/progress:
 *   get:
 *     tags: [Orders]
 *     summary: Get order progress updates
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Progress entries
 */
router.get("/:id/progress", ctrl.getProgress);

/**
 * @swagger
 * /orders/{id}/progress:
 *   post:
 *     tags: [Orders]
 *     summary: Post progress update (admin/collaborator)
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
 *               message: { type: string }
 *               percentage: { type: integer, minimum: 0, maximum: 100 }
 *     responses:
 *       201:
 *         description: Progress posted
 */
router.post("/:id/progress", authorize.role("admin", "collaborator"), ctrl.postProgress);

/**
 * @swagger
 * /orders/{id}/accept:
 *   patch:
 *     tags: [Orders]
 *     summary: Accept an order (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order accepted
 */
router.patch("/:id/accept", authorize.role("admin"), ctrl.accept);

/**
 * @swagger
 * /orders/{id}/reject:
 *   patch:
 *     tags: [Orders]
 *     summary: Reject an order (admin)
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
 *     responses:
 *       200:
 *         description: Order rejected
 */
router.patch("/:id/reject", authorize.role("admin"), ctrl.reject);

/**
 * @swagger
 * /orders/{id}/assign:
 *   patch:
 *     tags: [Orders]
 *     summary: Assign collaborator to order (admin)
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
 *             required: [collaborator_id]
 *             properties:
 *               collaborator_id: { type: integer }
 *     responses:
 *       200:
 *         description: Collaborator assigned
 */
router.patch("/:id/assign", authorize.role("admin"), ctrl.assign);

/**
 * @swagger
 * /orders/{id}/confirm-payment:
 *   patch:
 *     tags: [Orders]
 *     summary: Confirm order payment (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.patch("/:id/confirm-payment", authorize.role("admin"), ctrl.confirmPayment);

/**
 * @swagger
 * /orders/{id}/start:
 *   patch:
 *     tags: [Orders]
 *     summary: Start working on order (admin/collaborator)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order started
 */
router.patch("/:id/start", authorize.role("admin", "collaborator"), ctrl.start);

/**
 * @swagger
 * /orders/{id}/complete:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark order as complete (admin/collaborator)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order completed
 */
router.patch("/:id/complete", authorize.role("admin", "collaborator"), ctrl.complete);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order
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
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.patch("/:id/cancel", ctrl.cancel);

/**
 * @swagger
 * /orders/{id}/payment-proof:
 *   patch:
 *     tags: [Orders]
 *     summary: Upload payment proof URL (client)
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
 *             required: [proof_url]
 *             properties:
 *               proof_url: { type: string }
 *     responses:
 *       200:
 *         description: Payment proof uploaded
 */
router.patch("/:id/payment-proof", authorize.role("client"), ctrl.uploadPaymentProof);

/**
 * @swagger
 * /orders/{id}/payment-proof:
 *   get:
 *     tags: [Orders]
 *     summary: Get payment proof for an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment proof data
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id/payment-proof", ctrl.getPaymentProof);

module.exports = router;
