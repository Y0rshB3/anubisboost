"use strict";

const { Router } = require("express");
const svc = require("./payments.service");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * /orders/{orderId}/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment list
 */
router.get("/", async (req, res) => { res.json({ success: true, data: await svc.listByOrder(req.params.orderId) }); });

/**
 * @swagger
 * /orders/{orderId}/payments/summary:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment summary for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment summary (total, paid, remaining)
 */
router.get("/summary", async (req, res) => { res.json({ success: true, data: await svc.summary(req.params.orderId) }); });

/**
 * @swagger
 * /orders/{orderId}/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payment (admin)
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
 *             required: [amount, method]
 *             properties:
 *               amount: { type: number }
 *               method: { type: string }
 *               reference: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post("/", authorize("payments:manage"), async (req, res) => {
  const data = await svc.record(req.params.orderId, req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/payments/{paymentId}:
 *   patch:
 *     tags: [Payments]
 *     summary: Update a payment (admin)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               method: { type: string }
 *               reference: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Payment updated
 */
router.patch("/:paymentId", authorize("payments:manage"), async (req, res) => {
  await svc.update(req.params.paymentId, req.body);
  res.json({ success: true });
});

/**
 * @swagger
 * /orders/{orderId}/payments/{paymentId}:
 *   delete:
 *     tags: [Payments]
 *     summary: Delete a payment (admin)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment deleted
 */
router.delete("/:paymentId", authorize("payments:manage"), async (req, res) => {
  await svc.remove(req.params.paymentId);
  res.json({ success: true });
});

module.exports = router;
