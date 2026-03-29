"use strict";

const svc = require("./orders.service");
const { ROLES } = require("../../shared/constants");

async function create(req, res) {
  const order = await svc.create({ clientId: req.user.id, ...req.body });
  res.status(201).json({ success: true, data: order });
}

async function getById(req, res) {
  const order = await svc.getById(req.params.id);
  // Scope check: client can only see own orders
  if (req.user.role === ROLES.CLIENT && order.client_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  if (req.user.role === ROLES.COLLABORATOR && order.collaborator_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  res.json({ success: true, data: order });
}

async function list(req, res) {
  if (req.user.role === ROLES.CLIENT) {
    const result = await svc.listByClient(req.user.id, req.query);
    return res.json({ success: true, ...result });
  }
  if (req.user.role === ROLES.COLLABORATOR) {
    const result = await svc.listByCollaborator(req.user.id, req.query);
    return res.json({ success: true, ...result });
  }
  const result = await svc.listAll(req.query);
  res.json({ success: true, ...result });
}

async function accept(req, res) {
  const order = await svc.transition(req.params.id, "accepted", req.user.id, req.body);
  res.json({ success: true, data: order });
}

async function reject(req, res) {
  const order = await svc.transition(req.params.id, "rejected", req.user.id, { reason: req.body.reason });
  res.json({ success: true, data: order });
}

async function confirmPayment(req, res) {
  const order = await svc.transition(req.params.id, "payment_confirmed", req.user.id, req.body);
  res.json({ success: true, data: order });
}

async function start(req, res) {
  const order = await svc.transition(req.params.id, "in_progress", req.user.id, req.body);
  res.json({ success: true, data: order });
}

async function complete(req, res) {
  const order = await svc.transition(req.params.id, "completed", req.user.id, req.body);
  res.json({ success: true, data: order });
}

async function cancel(req, res) {
  const order = await svc.transition(req.params.id, "cancelled", req.user.id, { reason: req.body.reason });
  res.json({ success: true, data: order });
}

async function assign(req, res) {
  const order = await svc.assign(req.params.id, req.body.collaborator_id);
  res.json({ success: true, data: order });
}

async function history(req, res) {
  const data = await svc.getHistory(req.params.id);
  res.json({ success: true, data });
}

async function postProgress(req, res) {
  const data = await svc.postProgress(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data });
}

async function getProgress(req, res) {
  const data = await svc.getProgress(req.params.id);
  res.json({ success: true, data });
}

async function uploadPaymentProof(req, res) {
  const data = await svc.uploadPaymentProof(req.params.id, req.user.id, req.body);
  res.json({ success: true, data });
}

async function getPaymentProof(req, res) {
  const data = await svc.getPaymentProof(req.params.id);
  res.json({ success: true, data });
}

module.exports = { create, getById, list, accept, reject, confirmPayment, start, complete, cancel, assign, history, postProgress, getProgress, uploadPaymentProof, getPaymentProof };
