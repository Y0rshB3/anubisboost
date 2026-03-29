"use strict";

const crypto = require("crypto");
const User = require("../../models/User");
const ApiError = require("../../shared/ApiError");
const mailer = require("../../shared/mailer");

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// --- 2FA ---

async function enable2FA(userId, method) {
  if (!["email", "sms"].includes(method)) throw ApiError.badRequest("Invalid 2FA method");
  const user = await User.query().findById(userId);
  if (!user) throw ApiError.notFound();

  if (method === "sms" && !user.phone) {
    throw ApiError.badRequest("Phone number required for SMS 2FA");
  }

  await User.query().findById(userId).patch({
    two_factor_enabled: true,
    two_factor_method: method,
  });

  return { enabled: true, method };
}

async function disable2FA(userId) {
  await User.query().findById(userId).patch({
    two_factor_enabled: false,
    two_factor_method: null,
    two_factor_code: null,
    two_factor_expires: null,
  });
  return { enabled: false };
}

async function send2FACode(userId) {
  const user = await User.query().findById(userId);
  if (!user || !user.two_factor_enabled) return;

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await User.query().findById(userId).patch({
    two_factor_code: code,
    two_factor_expires: expires,
  });

  if (user.two_factor_method === "email") {
    await mailer.send2FACode(user.email, code);
  } else if (user.two_factor_method === "sms") {
    console.log(`[2FA-SMS] Code for ${user.phone}: ${code}`);
    // TODO: SMS provider (Twilio, etc.)
  }

  return { sent: true, method: user.two_factor_method, destination: user.two_factor_method === "email" ? maskEmail(user.email) : maskPhone(user.phone) };
}

async function verify2FACode(userId, code) {
  const user = await User.query().findById(userId)
    .select("id", "two_factor_code", "two_factor_expires");
  if (!user) throw ApiError.notFound();

  if (!user.two_factor_code || user.two_factor_code !== code) {
    throw ApiError.unauthorized("Invalid verification code");
  }

  if (new Date(user.two_factor_expires) < new Date()) {
    throw ApiError.unauthorized("Verification code expired");
  }

  // Clear code after successful verification
  await User.query().findById(userId).patch({
    two_factor_code: null,
    two_factor_expires: null,
  });

  return { verified: true };
}

// --- Email Change ---

async function requestEmailChange(userId, newEmail) {
  // Check if email already taken
  const existing = await User.query().findOne({ email: newEmail }).whereNull("deleted_at");
  if (existing) throw ApiError.conflict("Email already in use");

  const code = generateCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000);

  await User.query().findById(userId).patch({
    pending_email: newEmail,
    email_change_code: code,
    email_change_expires: expires,
  });

  await mailer.sendEmailChangeCode(newEmail, code);

  return { sent: true, email: maskEmail(newEmail) };
}

async function confirmEmailChange(userId, code) {
  const user = await User.query().findById(userId)
    .select("id", "pending_email", "email_change_code", "email_change_expires");
  if (!user) throw ApiError.notFound();

  if (!user.email_change_code || user.email_change_code !== code) {
    throw ApiError.badRequest("Invalid verification code");
  }
  if (new Date(user.email_change_expires) < new Date()) {
    throw ApiError.badRequest("Verification code expired");
  }

  await User.query().findById(userId).patch({
    email: user.pending_email,
    pending_email: null,
    email_change_code: null,
    email_change_expires: null,
  });

  return { email: user.pending_email };
}

// --- Phone ---

async function updatePhone(userId, phone) {
  await User.query().findById(userId).patch({ phone });
  return { phone };
}

// Helpers
function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  return local.slice(0, 2) + "***@" + domain;
}

function maskPhone(phone) {
  if (!phone) return "";
  return "***" + phone.slice(-4);
}

module.exports = { enable2FA, disable2FA, send2FACode, verify2FACode, requestEmailChange, confirmEmailChange, updatePhone };
