"use strict";

const crypto = require("crypto");
const Contract = require("../../models/Contract");
const ContractPolicy = require("../../models/ContractPolicy");
const ApiError = require("../../shared/ApiError");
const notificationService = require("../notifications/notifications.service");

async function generate(orderId, { templateId, scheduledDates } = {}) {
  let template;
  if (templateId) {
    template = await ContractPolicy.query()
      .findById(templateId)
      .where("is_active", true);
    if (!template) throw ApiError.notFound("Contract policy not found");
  } else {
    template = await ContractPolicy.query()
      .findOne({ is_default: true, is_active: true });
    if (!template) throw ApiError.notFound("No default contract policy");
  }

  let html = template.content_template;
  // Sanitize input to prevent XSS injection via contract content
  const sanitize = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  if (scheduledDates) html = html.replace("{{scheduled_dates}}", sanitize(String(scheduledDates)));
  else html = html.replace("{{scheduled_dates}}", "To be determined");

  const contentHash = crypto.createHash("sha256").update(html).digest("hex");

  // Upsert: insert or update on duplicate order_id
  const existing = await Contract.query().findOne({ order_id: orderId });
  if (existing) {
    await Contract.query().findById(existing.id).patch({
      content_html: html,
      content_hash: contentHash,
      status: "pending_client",
    });
  } else {
    await Contract.query().insert({
      order_id: orderId,
      template_version: "v1",
      content_html: html,
      content_hash: contentHash,
      status: "pending_client",
      scheduled_dates: scheduledDates ? scheduledDates : null,
    });
  }
  return getByOrder(orderId);
}

async function getByOrder(orderId) {
  const contract = await Contract.query().findOne({ order_id: orderId });
  if (!contract) throw ApiError.notFound("Contract not found");
  return contract;
}

async function signClient(orderId, { ip, userAgent, consentText }) {
  const contract = await getByOrder(orderId);
  if (contract.client_signed_at) throw ApiError.conflict("Client already signed");

  // Verify integrity
  const currentHash = crypto.createHash("sha256").update(contract.content_html).digest("hex");
  if (currentHash !== contract.content_hash) throw ApiError.conflict("Contract tampered");

  const newStatus = contract.admin_signed_at ? "fully_signed" : "pending_admin";
  await Contract.query().findById(contract.id).patch({
    client_signed_at: new Date(),
    client_ip: ip,
    client_user_agent: userAgent,
    client_consent_text: consentText || "I agree to the terms",
    status: newStatus,
  });

  // Notify admin that client signed
  await notifyContractEvent(orderId, "El cliente ha firmado el contrato.");

  return getByOrder(orderId);
}

async function signAdmin(orderId, adminId, { ip, consentText }) {
  const contract = await getByOrder(orderId);
  if (contract.admin_signed_at) throw ApiError.conflict("Admin already signed");

  const currentHash = crypto.createHash("sha256").update(contract.content_html).digest("hex");
  if (currentHash !== contract.content_hash) throw ApiError.conflict("Contract tampered");

  const newStatus = contract.client_signed_at ? "fully_signed" : "pending_client";
  await Contract.query().findById(contract.id).patch({
    admin_signed_at: new Date(),
    admin_id: adminId,
    admin_ip: ip,
    admin_consent_text: consentText || "I agree to the terms",
    status: newStatus,
  });

  // Notify client that admin signed
  await notifyContractEvent(orderId, "El administrador ha firmado el contrato.");

  return getByOrder(orderId);
}

async function voidContract(orderId, reason) {
  const contract = await getByOrder(orderId);
  await Contract.query().findById(contract.id).patch({
    status: "voided",
    voided_at: new Date(),
    voided_reason: reason,
  });
  return getByOrder(orderId);
}

// Contract Policies CRUD
async function listPolicies() {
  return ContractPolicy.query().where("is_active", true).orderBy("name");
}

async function createPolicy(data) {
  const policy = await ContractPolicy.query().insert({
    name: data.name,
    content_template: data.content_template,
    is_default: data.is_default || false,
  });
  return { id: policy.id, ...data };
}

async function updatePolicy(id, data) {
  await ContractPolicy.query().findById(id).patch(data);
}

async function notifyContractEvent(orderId, body) {
  try {
    const Order = require("../../models/Order");
    const User = require("../../models/User");
    const order = await Order.query()
      .alias("o")
      .select("o.id", "o.order_number", "o.client_id", "o.collaborator_id")
      .where("o.id", orderId).first();
    if (!order) return;

    const recipients = new Set();
    if (order.client_id) recipients.add(order.client_id);
    if (order.collaborator_id) recipients.add(order.collaborator_id);
    const admins = await User.query().joinRelated("role").where("role.name", "admin").where("users.is_active", true).select("users.id");
    admins.forEach((a) => recipients.add(a.id));

    for (const uid of recipients) {
      await notificationService.create({
        userId: uid,
        type: "order.contract_signed",
        title: `📝 Contrato - ${order.order_number}`,
        body,
        data: { orderId: order.id, orderNumber: order.order_number },
      });
    }
  } catch (err) {
    console.error("Contract notification error:", err.message);
  }
}

// Edit contract content (only before any signatures)
async function editContract(orderId, { content_html }) {
  const contract = await getByOrder(orderId);
  // Allow edit if: no client signature yet, OR status is disputed
  if (contract.client_signed_at && contract.status !== "disputed") {
    throw ApiError.conflict("Cannot edit after client has signed");
  }
  const contentHash = crypto.createHash("sha256").update(content_html).digest("hex");
  await Contract.query().findById(contract.id).patch({
    content_html,
    content_hash: contentHash,
    status: "pending_client",
    dispute_reason: null,
    disputed_at: null,
    disputed_by: null,
    // Reset admin signature since content changed
    admin_signed_at: null,
    admin_id: null,
    admin_ip: null,
    admin_consent_text: null,
  });
  await notifyContractEvent(orderId, "El contrato ha sido modificado. Por favor revísalo nuevamente.");
  return getByOrder(orderId);
}

// Client disputes the contract
async function disputeContract(orderId, userId, reason) {
  const contract = await getByOrder(orderId);
  if (contract.client_signed_at) throw ApiError.conflict("Cannot dispute after signing");
  if (contract.status === "skipped") throw ApiError.conflict("Contract was skipped");

  await Contract.query().findById(contract.id).patch({
    status: "disputed",
    dispute_reason: reason,
    disputed_at: new Date(),
    disputed_by: userId,
  });
  await notifyContractEvent(orderId, `⚠️ El cliente ha solicitado cambios en el contrato: "${reason}"`);
  return getByOrder(orderId);
}

// Admin skips the contract requirement
async function skipContract(orderId) {
  const Order = require("../../models/Order");
  const existing = await Contract.query().findOne({ order_id: orderId });
  if (existing) {
    await Contract.query().findById(existing.id).patch({ status: "skipped" });
  }
  await Order.query().findById(orderId).patch({ contract_required: false });
  await notifyContractEvent(orderId, "El administrador ha decidido que no se requiere contrato para este pedido.");
  return { skipped: true };
}

module.exports = { generate, getByOrder, signClient, signAdmin, voidContract, editContract, disputeContract, skipContract, listPolicies, createPolicy, updatePolicy };
