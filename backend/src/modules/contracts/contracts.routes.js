"use strict";

const { Router } = require("express");
const svc = require("./contracts.service");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const auditLog = require("../../middleware/auditLog");

const router = Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * /orders/{orderId}/contract:
 *   post:
 *     tags: [Contracts]
 *     summary: Generate a contract for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policy_id: { type: integer }
 *     responses:
 *       201:
 *         description: Contract generated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/", authorize("contracts:create"), async (req, res) => {
  const data = await svc.generate(req.params.orderId, req.body);
  res.status(201).json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/contract:
 *   get:
 *     tags: [Contracts]
 *     summary: Get the contract for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Contract data
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/", async (req, res) => {
  const data = await svc.getByOrder(req.params.orderId);
  res.json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/contract/sign/client:
 *   post:
 *     tags: [Contracts]
 *     summary: Client signs the contract
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
 *             required: [consent_text]
 *             properties:
 *               consent_text: { type: string }
 *     responses:
 *       200:
 *         description: Contract signed by client
 */
router.post("/sign/client", authorize("contracts:sign_client"), auditLog("contract.signed_client", { entity: "order", idParam: "orderId" }), async (req, res) => {
  const data = await svc.signClient(req.params.orderId, { ip: req.ip, userAgent: req.headers["user-agent"], consentText: req.body.consent_text });
  res.json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/contract/sign/admin:
 *   post:
 *     tags: [Contracts]
 *     summary: Admin signs the contract
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
 *             required: [consent_text]
 *             properties:
 *               consent_text: { type: string }
 *     responses:
 *       200:
 *         description: Contract signed by admin
 */
router.post("/sign/admin", authorize("contracts:sign_admin"), auditLog("contract.signed_admin", { entity: "order", idParam: "orderId" }), async (req, res) => {
  const data = await svc.signAdmin(req.params.orderId, req.user.id, { ip: req.ip, consentText: req.body.consent_text });
  res.json({ success: true, data });
});

/**
 * @swagger
 * /orders/{orderId}/contract/void:
 *   post:
 *     tags: [Contracts]
 *     summary: Void a contract (admin)
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Contract voided
 */
router.post("/void", authorize.role("admin"), async (req, res) => {
  const data = await svc.voidContract(req.params.orderId, req.body.reason);
  res.json({ success: true, data });
});

// Edit contract (admin, before signatures)
router.patch("/", authorize.role("admin"), async (req, res) => {
  const data = await svc.editContract(req.params.orderId, req.body);
  res.json({ success: true, data });
});

// Client disputes the contract
router.post("/dispute", authorize("contracts:sign_client"), async (req, res) => {
  const data = await svc.disputeContract(req.params.orderId, req.user.id, req.body.reason);
  res.json({ success: true, data });
});

// Admin skips contract
router.post("/skip", authorize.role("admin"), async (req, res) => {
  const data = await svc.skipContract(req.params.orderId);
  res.json({ success: true, data });
});

// ─── Contract Policies (separate path: /api/v1/contract-policies) ────

const policiesRouter = Router();
policiesRouter.use(authenticate);

/**
 * @swagger
 * /contract-policies:
 *   get:
 *     tags: [Contracts]
 *     summary: List contract policies
 *     responses:
 *       200:
 *         description: List of policies
 */
policiesRouter.get("/", async (_req, res) => { res.json({ success: true, data: await svc.listPolicies() }); });

/**
 * @swagger
 * /contract-policies:
 *   post:
 *     tags: [Contracts]
 *     summary: Create a contract policy (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               content: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: Policy created
 */
policiesRouter.post("/", authorize.role("admin"), async (req, res) => { res.status(201).json({ success: true, data: await svc.createPolicy(req.body) }); });

/**
 * @swagger
 * /contract-policies/{id}:
 *   patch:
 *     tags: [Contracts]
 *     summary: Update a contract policy (admin)
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
 *               name: { type: string }
 *               content: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Policy updated
 */
policiesRouter.patch("/:id", authorize.role("admin"), async (req, res) => { await svc.updatePolicy(req.params.id, req.body); res.json({ success: true }); });

module.exports = { contractRouter: router, policiesRouter };
