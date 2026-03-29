"use strict";

const service = require("./users.service");

async function list(req, res) {
  const result = await service.list(req.query);
  res.json({ success: true, ...result });
}

async function getById(req, res) {
  const user = await service.getById(req.params.id);
  res.json({ success: true, data: user });
}

async function create(req, res) {
  const user = await service.create(req.body);
  res.status(201).json({ success: true, data: user });
}

async function update(req, res) {
  const user = await service.update(req.params.id, req.body);
  res.json({ success: true, data: user });
}

async function changeRole(req, res) {
  const user = await service.changeRole(req.params.id, req.body.role_id);
  res.json({ success: true, data: user });
}

async function toggleStatus(req, res) {
  const user = await service.toggleStatus(req.params.id, req.body.is_active);
  res.json({ success: true, data: user });
}

async function remove(req, res) {
  await service.softDelete(req.params.id);
  res.json({ success: true, message: "User deleted" });
}

async function getProfile(req, res) {
  const user = await service.getById(req.user.id);
  res.json({ success: true, data: user });
}

async function updateProfile(req, res) {
  const user = await service.update(req.user.id, req.body);
  res.json({ success: true, data: user });
}

async function changePassword(req, res) {
  await service.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: "Password changed" });
}

module.exports = { list, getById, create, update, changeRole, toggleStatus, remove, getProfile, updateProfile, changePassword };
