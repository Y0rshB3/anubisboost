"use strict";

const Credential = require("../../models/Credential");
const { encrypt, decrypt } = require("../../shared/crypto");
const ApiError = require("../../shared/ApiError");

async function upload(orderId, userId, plainCredentials) {
  const existing = await Credential.query().findOne({ order_id: orderId });
  const encrypted = encrypt(plainCredentials);

  if (existing) {
    await Credential.query().findById(existing.id).patch({
      iv: encrypted.iv,
      auth_tag: encrypted.auth_tag,
      ciphertext: encrypted.ciphertext,
      uploaded_by: userId,
      viewed_at: null,
    });
  } else {
    await Credential.query().insert({
      order_id: orderId,
      uploaded_by: userId,
      iv: encrypted.iv,
      auth_tag: encrypted.auth_tag,
      ciphertext: encrypted.ciphertext,
    });
  }
  return { orderId, uploaded: true };
}

async function view(orderId) {
  const cred = await Credential.query().findOne({ order_id: orderId });
  if (!cred) throw ApiError.notFound("Credentials not found");

  if (!cred.viewed_at) {
    await Credential.query().findById(cred.id).patch({ viewed_at: new Date() });
  }
  return decrypt({ iv: cred.iv, auth_tag: cred.auth_tag, ciphertext: cred.ciphertext });
}

async function exists(orderId) {
  const cred = await Credential.query().findOne({ order_id: orderId }).select("id");
  return !!cred;
}

async function remove(orderId) {
  await Credential.query().delete().where("order_id", orderId);
}

module.exports = { upload, view, exists, remove };
