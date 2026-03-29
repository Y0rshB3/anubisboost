"use strict";

const { Router } = require("express");
const ctrl = require("./catalog.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = Router();

// ─── Public ──────────────────────────────────────────────

/**
 * @swagger
 * /catalog/games:
 *   get:
 *     tags: [Catalog]
 *     summary: List all games
 *     security: []
 *     responses:
 *       200:
 *         description: List of games
 */
router.get("/games", ctrl.listGames);

/**
 * @swagger
 * /catalog/games/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get game by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Game details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/games/:id", ctrl.getGame);

/**
 * @swagger
 * /catalog/platforms:
 *   get:
 *     tags: [Catalog]
 *     summary: List all platforms
 *     security: []
 *     responses:
 *       200:
 *         description: List of platforms
 */
router.get("/platforms", ctrl.listPlatforms);

/**
 * @swagger
 * /catalog/service-types:
 *   get:
 *     tags: [Catalog]
 *     summary: List all service types
 *     security: []
 *     responses:
 *       200:
 *         description: List of service types
 */
router.get("/service-types", ctrl.listServiceTypes);

/**
 * @swagger
 * /catalog/services:
 *   get:
 *     tags: [Catalog]
 *     summary: List all services
 *     security: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.get("/services", ctrl.listServices);

/**
 * @swagger
 * /catalog/services/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get service by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service details with price rules
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/services/:id", ctrl.getService);

// ─── Admin only ──────────────────────────────────────────

/**
 * @swagger
 * /catalog/games:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a game (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               cover_url: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: Game created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/games", authenticate, authorize("catalog:manage"), ctrl.createGame);

/**
 * @swagger
 * /catalog/games/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Update a game (admin)
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
 *               slug: { type: string }
 *               cover_url: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Game updated
 */
router.patch("/games/:id", authenticate, authorize("catalog:manage"), ctrl.updateGame);

/**
 * @swagger
 * /catalog/games/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a game (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Game deleted
 */
router.delete("/games/:id", authenticate, authorize("catalog:manage"), ctrl.deleteGame);

/**
 * @swagger
 * /catalog/platforms:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a platform (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201:
 *         description: Platform created
 */
router.post("/platforms", authenticate, authorize("catalog:manage"), ctrl.createPlatform);

/**
 * @swagger
 * /catalog/platforms/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Update a platform (admin)
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
 *               slug: { type: string }
 *     responses:
 *       200:
 *         description: Platform updated
 */
router.patch("/platforms/:id", authenticate, authorize("catalog:manage"), ctrl.updatePlatform);

/**
 * @swagger
 * /catalog/platforms/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a platform (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Platform deleted
 */
router.delete("/platforms/:id", authenticate, authorize("catalog:manage"), ctrl.deletePlatform);

/**
 * @swagger
 * /catalog/service-types:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a service type (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201:
 *         description: Service type created
 */
router.post("/service-types", authenticate, authorize("catalog:manage"), ctrl.createServiceType);

/**
 * @swagger
 * /catalog/services:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a service (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [game_id, platform_id, service_type_id, name, base_price]
 *             properties:
 *               game_id: { type: integer }
 *               platform_id: { type: integer }
 *               service_type_id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               base_price: { type: number }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: Service created
 */
router.post("/services", authenticate, authorize("catalog:manage"), ctrl.createService);

/**
 * @swagger
 * /catalog/services/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Update a service (admin)
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
 *               description: { type: string }
 *               base_price: { type: number }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Service updated
 */
router.patch("/services/:id", authenticate, authorize("catalog:manage"), ctrl.updateService);

/**
 * @swagger
 * /catalog/services/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a service (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.delete("/services/:id", authenticate, authorize("catalog:manage"), ctrl.deleteService);

/**
 * @swagger
 * /catalog/services/{id}/price-rules:
 *   post:
 *     tags: [Catalog]
 *     summary: Add a price rule to a service (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label: { type: string }
 *               type: { type: string }
 *               value: { type: number }
 *     responses:
 *       201:
 *         description: Price rule added
 */
router.post("/services/:id/price-rules", authenticate, authorize("catalog:manage"), ctrl.addPriceRule);

/**
 * @swagger
 * /catalog/services/{id}/price-rules/{ruleId}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a price rule (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Service ID
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Price rule deleted
 */
router.delete("/services/:id/price-rules/:ruleId", authenticate, authorize("catalog:manage"), ctrl.deletePriceRule);

module.exports = router;
