"use strict";

const Ban = require("../models/Ban");
const ApiError = require("../shared/ApiError");

async function checkBan(req, _res, next) {
  const ip = req.ip;
  const email = req.body?.email;

  const conditions = [
    Ban.query().findOne({ ban_type: "ip", ban_value: ip, is_active: true })
      .where(function () { this.whereNull("expires_at").orWhere("expires_at", ">", new Date()); }),
  ];

  if (email) {
    conditions.push(
      Ban.query().findOne({ ban_type: "email", ban_value: email, is_active: true })
        .where(function () { this.whereNull("expires_at").orWhere("expires_at", ">", new Date()); })
    );
  }

  const results = await Promise.all(conditions);
  const ban = results.find(Boolean);

  if (ban) {
    throw ApiError.forbidden(`Access denied. Reason: ${ban.reason || "Banned"}`);
  }

  next();
}

module.exports = checkBan;
