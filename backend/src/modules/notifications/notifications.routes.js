"use strict";

const { Router } = require("express");
const svc = require("./notifications.service");
const authenticate = require("../../middleware/authenticate");

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for the current user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated notifications with unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *                 unreadCount: { type: integer }
 */
router.get("/", async (req, res) => {
  const result = await svc.list(req.user.id, req.query);
  const unread = await svc.unreadCount(req.user.id);
  res.json({ success: true, ...result, unreadCount: unread });
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/:id/read", async (req, res) => {
  await svc.markRead(req.params.id, req.user.id);
  res.json({ success: true });
});

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/read-all", async (req, res) => {
  await svc.markAllRead(req.user.id);
  res.json({ success: true });
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete("/:id", async (req, res) => {
  await svc.remove(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
