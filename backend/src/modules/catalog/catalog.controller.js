"use strict";

const svc = require("./catalog.service");

// Games
async function listGames(req, res) { res.json({ success: true, ...(await svc.listGames(req.query)) }); }
async function getGame(req, res) { res.json({ success: true, data: await svc.getGame(req.params.id) }); }
async function createGame(req, res) { res.status(201).json({ success: true, data: await svc.createGame(req.body) }); }
async function updateGame(req, res) { res.json({ success: true, data: await svc.updateGame(req.params.id, req.body) }); }
async function deleteGame(req, res) { await svc.deleteGame(req.params.id); res.json({ success: true }); }

// Platforms
async function listPlatforms(_req, res) { res.json({ success: true, data: await svc.listPlatforms() }); }
async function createPlatform(req, res) { res.status(201).json({ success: true, data: await svc.createPlatform(req.body) }); }
async function updatePlatform(req, res) { await svc.updatePlatform(req.params.id, req.body); res.json({ success: true }); }
async function deletePlatform(req, res) { await svc.deletePlatform(req.params.id); res.json({ success: true }); }

// Service Types
async function listServiceTypes(_req, res) { res.json({ success: true, data: await svc.listServiceTypes() }); }
async function createServiceType(req, res) { res.status(201).json({ success: true, data: await svc.createServiceType(req.body) }); }

// Services
async function listServices(req, res) { res.json({ success: true, ...(await svc.listServices(req.query)) }); }
async function getService(req, res) { res.json({ success: true, data: await svc.getService(req.params.id) }); }
async function createService(req, res) { res.status(201).json({ success: true, data: await svc.createService(req.body) }); }
async function updateService(req, res) { res.json({ success: true, data: await svc.updateService(req.params.id, req.body) }); }
async function deleteService(req, res) { await svc.deleteService(req.params.id); res.json({ success: true }); }

// Price Rules
async function addPriceRule(req, res) { res.status(201).json({ success: true, data: await svc.addPriceRule(req.params.id, req.body) }); }
async function deletePriceRule(req, res) { await svc.deletePriceRule(req.params.ruleId); res.json({ success: true }); }

module.exports = {
  listGames, getGame, createGame, updateGame, deleteGame,
  listPlatforms, createPlatform, updatePlatform, deletePlatform,
  listServiceTypes, createServiceType,
  listServices, getService, createService, updateService, deleteService,
  addPriceRule, deletePriceRule,
};
