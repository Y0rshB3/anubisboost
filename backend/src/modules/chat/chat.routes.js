"use strict";

const { Router } = require("express");
const svc = require("./chat.service");
const authenticate = require("../../middleware/authenticate");

const router = Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * /orders/{orderId}/chat/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat messages for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated chat messages
 */
router.get("/messages", async (req, res) => {
  const data = await svc.getMessages(req.params.orderId, req.query);
  res.json({ success: true, ...data });
});

module.exports = router;
