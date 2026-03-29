"use strict";

const jwt = require("jsonwebtoken");

const isProd = () => process.env.NODE_ENV === "production";

const ACCESS_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s === "replace-with-64-char-random-string-for-access-tokens") {
    if (isProd()) throw new Error("FATAL: JWT_SECRET must be set in production");
    return "dev-only-jwt-secret-do-not-use-in-prod";
  }
  return s;
};

const REFRESH_SECRET = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s || s === "replace-with-another-64-char-random-string") {
    if (isProd()) throw new Error("FATAL: JWT_REFRESH_SECRET must be set in production");
    return "dev-only-refresh-secret-do-not-use-in-prod";
  }
  return s;
};

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET(), { expiresIn: "15m" });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: "7d" });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET());
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
