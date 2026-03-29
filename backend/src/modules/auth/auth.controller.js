"use strict";

const authService = require("./auth.service");

async function register(req, res) {
  const tokens = await authService.register(req.body);
  res.status(201).json({ success: true, data: tokens });
}

async function login(req, res) {
  const tokens = await authService.login({
    ...req.body,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  res.json({ success: true, data: tokens });
}

async function refresh(req, res) {
  const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;
  const tokens = await authService.refresh(refreshToken);
  res.json({ success: true, data: tokens });
}

async function logout(req, res) {
  const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;
  await authService.logout(refreshToken);
  res.json({ success: true, message: "Logged out" });
}

async function forgotPassword(req, res) {
  const token = await authService.forgotPassword(req.body.email);
  if (token) {
    const mailer = require("../../shared/mailer");
    await mailer.sendPasswordReset(req.body.email, token);
  }
  res.json({ success: true, message: "If the email exists, a reset link was sent" });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: "Password reset successful" });
}

async function me(req, res) {
  const profile = await authService.getProfile(req.user.id);
  res.json({ success: true, data: profile });
}

async function verify2FA(req, res) {
  const tokens = await authService.verify2FALogin(req.body.userId, req.body.code);
  res.json({ success: true, data: tokens });
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, me, verify2FA };
