"use strict";

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const isProd = () => process.env.NODE_ENV === "production";

function getKey() {
  const envKey = process.env.AES_SECRET_KEY;
  if (!envKey || envKey === "replace-with-64-hex-chars-for-aes-256-key") {
    if (isProd()) throw new Error("FATAL: AES_SECRET_KEY must be set in production");
    // Dev fallback - NOT secure
    return crypto.createHash("sha256").update("dev-only-aes-key").digest();
  }
  return crypto.createHash("sha256").update(envKey).digest();
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(JSON.stringify(plaintext), "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    auth_tag: authTag.toString("hex"),
    ciphertext,
  };
}

function decrypt(encryptedData) {
  const key = getKey();
  const iv = Buffer.from(encryptedData.iv, "hex");
  const authTag = Buffer.from(encryptedData.auth_tag, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let plaintext = decipher.update(encryptedData.ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");
  return JSON.parse(plaintext);
}

module.exports = { encrypt, decrypt };
