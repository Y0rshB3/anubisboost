"use strict";

const { Router } = require("express");
const Faq = require("../../models/Faq");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = Router();

/**
 * @swagger
 * /faqs/client:
 *   get:
 *     tags: [FAQ]
 *     summary: List client FAQs (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Active client FAQs sorted by order
 */
router.get("/client", async (_req, res) => {
  const faqs = await Faq.query().where({ category: "client", is_active: true }).orderBy("sort_order");
  res.json({ success: true, data: faqs });
});

/**
 * @swagger
 * /faqs/admin:
 *   get:
 *     tags: [FAQ]
 *     summary: List admin guide FAQs (admin)
 *     responses:
 *       200:
 *         description: Active admin FAQs
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/admin", authenticate, authorize.role("admin"), async (_req, res) => {
  const faqs = await Faq.query().where({ category: "admin", is_active: true }).orderBy("sort_order");
  res.json({ success: true, data: faqs });
});

/**
 * @swagger
 * /faqs:
 *   get:
 *     tags: [FAQ]
 *     summary: List all FAQs for management (admin)
 *     responses:
 *       200:
 *         description: All FAQs (active and inactive)
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/", authenticate, authorize.role("admin"), async (_req, res) => {
  const faqs = await Faq.query().orderBy("category").orderBy("sort_order");
  res.json({ success: true, data: faqs });
});

/**
 * @swagger
 * /faqs:
 *   post:
 *     tags: [FAQ]
 *     summary: Create a FAQ (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer, category]
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *               category: { type: string, enum: [client, admin] }
 *               sort_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: FAQ created
 */
router.post("/", authenticate, authorize.role("admin"), async (req, res) => {
  const faq = await Faq.query().insert(req.body);
  res.status(201).json({ success: true, data: faq });
});

/**
 * @swagger
 * /faqs/{id}:
 *   patch:
 *     tags: [FAQ]
 *     summary: Update a FAQ (admin)
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
 *               question: { type: string }
 *               answer: { type: string }
 *               category: { type: string }
 *               sort_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: FAQ updated
 */
router.patch("/:id", authenticate, authorize.role("admin"), async (req, res) => {
  await Faq.query().findById(req.params.id).patch(req.body);
  res.json({ success: true });
});

/**
 * @swagger
 * /faqs/{id}:
 *   delete:
 *     tags: [FAQ]
 *     summary: Delete a FAQ (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: FAQ deleted
 */
router.delete("/:id", authenticate, authorize.role("admin"), async (req, res) => {
  await Faq.query().deleteById(req.params.id);
  res.json({ success: true });
});

module.exports = router;
