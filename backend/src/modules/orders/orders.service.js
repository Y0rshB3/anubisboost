"use strict";

const Order = require("../../models/Order");
const OrderStatusHistory = require("../../models/OrderStatusHistory");
const OrderProgress = require("../../models/OrderProgress");
const Service = require("../../models/Service");
const User = require("../../models/User");
const ApiError = require("../../shared/ApiError");
const { VALID_TRANSITIONS } = require("../../shared/constants");
const { paginate } = require("../../shared/paginate");
const { escapeLike } = require("../../shared/escapeLike");
const notificationService = require("../notifications/notifications.service");

const STATUS_TITLES = {
  accepted: "✅ Pedido aceptado",
  rejected: "❌ Pedido rechazado",
  payment_confirmed: "💰 Pago confirmado",
  in_progress: "🚀 Trabajo iniciado",
  completed: "🎉 Pedido completado",
  cancelled: "🚫 Pedido cancelado",
};

const STATUS_BODIES = {
  accepted: "Tu pedido ha sido aceptado. Sube tu comprobante de pago.",
  rejected: "Tu pedido ha sido rechazado.",
  payment_confirmed: "El pago ha sido confirmado.",
  in_progress: "El booster ha comenzado a trabajar en tu cuenta.",
  completed: "Tu pedido ha sido completado. ¡Disfruta!",
  cancelled: "El pedido ha sido cancelado.",
};

async function notifyParticipants(order, triggeredByUserId, type, detail) {
  try {
    const recipients = new Set();
    if (order.client_id) recipients.add(order.client_id);
    if (order.collaborator_id) recipients.add(order.collaborator_id);

    // Also notify admins
    const admins = await User.query()
      .joinRelated("role")
      .where("role.name", "admin")
      .where("users.is_active", true)
      .select("users.id");
    admins.forEach((a) => recipients.add(a.id));

    recipients.delete(triggeredByUserId);

    let title, body;
    if (type === "order.status_changed") {
      title = `${STATUS_TITLES[detail] || detail} - ${order.order_number}`;
      body = STATUS_BODIES[detail] || `Estado cambiado a: ${detail}`;
    } else if (type === "order.payment_proof") {
      title = `📎 Comprobante de pago - ${order.order_number}`;
      body = "El cliente ha subido un comprobante de pago.";
    } else if (type === "order.progress") {
      title = `📊 Actualización - ${order.order_number}`;
      body = detail;
    } else if (type === "order.credentials_uploaded") {
      title = `🔐 Credenciales subidas - ${order.order_number}`;
      body = "El cliente ha subido las credenciales de su cuenta.";
    } else if (type === "order.contract_signed") {
      title = `📝 Contrato firmado - ${order.order_number}`;
      body = detail;
    } else {
      title = `${order.order_number}`;
      body = detail || "";
    }

    for (const uid of recipients) {
      await notificationService.create({
        userId: uid, type, title, body,
        data: { orderId: order.id, orderNumber: order.order_number },
      });
    }
  } catch (err) {
    console.error("Notification error:", err.message);
  }
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AB-${ts}-${rand}`;
}

async function create({ clientId, serviceId, desiredResult, paymentType }) {
  const svc = await Service.query()
    .alias("s")
    .select(
      "s.*",
      "g.name as game_name", "p.name as platform_name", "st.name as type_name"
    )
    .join("games as g", "s.game_id", "g.id")
    .join("platforms as p", "s.platform_id", "p.id")
    .join("service_types as st", "s.service_type_id", "st.id")
    .where("s.id", serviceId)
    .whereNull("s.deleted_at")
    .first();

  if (!svc) throw ApiError.notFound("Service not found");

  const snapshot = {
    id: svc.id,
    name: svc.name,
    game: svc.game_name,
    platform: svc.platform_name,
    type: svc.type_name,
    base_price: svc.base_price,
  };
  const orderNumber = generateOrderNumber();

  const order = await Order.query().insert({
    order_number: orderNumber,
    client_id: clientId,
    service_id: serviceId,
    status: "pending",
    service_snapshot: JSON.stringify(snapshot),
    desired_result: desiredResult || null,
    total_price: parseFloat(svc.base_price),
    currency: svc.currency,
    payment_type: paymentType || null,
  });

  // Notify admins of new order
  try {
    const admins = await User.query()
      .joinRelated("role")
      .where("role.name", "admin")
      .where("users.is_active", true)
      .select("users.id");
    for (const admin of admins) {
      await notificationService.create({
        userId: admin.id,
        type: "order.new",
        title: `🆕 Nuevo pedido: ${orderNumber}`,
        body: `${snapshot.name} - ${snapshot.game} (${snapshot.platform})`,
        data: { orderId: order.id, orderNumber },
      });
    }
  } catch (err) {
    console.error("New order notification error:", err.message);
  }

  return getById(order.id);
}

async function getById(id) {
  const order = await Order.query()
    .alias("o")
    .select("o.*", "c.username as client_name", "col.username as collaborator_name")
    .join("users as c", "o.client_id", "c.id")
    .leftJoin("users as col", "o.collaborator_id", "col.id")
    .where("o.id", id)
    .whereNull("o.deleted_at")
    .first();

  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

async function listAll({ page, limit, status, search }) {
  const query = Order.query()
    .alias("o")
    .select("o.*", "c.username as client_name", "col.username as collaborator_name")
    .join("users as c", "o.client_id", "c.id")
    .leftJoin("users as col", "o.collaborator_id", "col.id")
    .whereNull("o.deleted_at")
    .orderBy("o.created_at", "desc");

  if (status) query.where("o.status", status);
  if (search) {
    query.where((qb) => {
      const s = escapeLike(search);
      qb.where("o.order_number", "like", `%${s}%`)
        .orWhere("c.username", "like", `%${s}%`);
    });
  }

  return paginate(query, page, limit);
}

async function listByClient(clientId, { page, limit, status }) {
  const query = Order.query()
    .alias("o")
    .select("o.*", "col.username as collaborator_name")
    .leftJoin("users as col", "o.collaborator_id", "col.id")
    .where("o.client_id", clientId)
    .whereNull("o.deleted_at")
    .orderBy("o.created_at", "desc");

  if (status) query.where("o.status", status);

  return paginate(query, page, limit);
}

async function listByCollaborator(collabId, { page, limit, status }) {
  const query = Order.query()
    .alias("o")
    .select("o.*", "c.username as client_name")
    .join("users as c", "o.client_id", "c.id")
    .where("o.collaborator_id", collabId)
    .whereNull("o.deleted_at")
    .orderBy("o.created_at", "desc");

  if (status) query.where("o.status", status);

  return paginate(query, page, limit);
}

async function transition(orderId, toStatus, userId, { note, reason } = {}) {
  const order = await getById(orderId);
  const validNext = VALID_TRANSITIONS[order.status];
  if (!validNext || !validNext.includes(toStatus)) {
    throw ApiError.conflict(`Cannot transition from '${order.status}' to '${toStatus}'`);
  }

  const patch = { status: toStatus };
  if (toStatus === "in_progress") patch.started_at = new Date();
  if (toStatus === "completed") patch.completed_at = new Date();
  if (toStatus === "cancelled" && reason) patch.cancelled_reason = reason;
  if (toStatus === "rejected" && reason) patch.rejected_reason = reason;

  await Order.query().findById(orderId).patch(patch);

  await OrderStatusHistory.query().insert({
    order_id: orderId,
    changed_by: userId,
    from_status: order.status,
    to_status: toStatus,
    note: note || null,
  });

  // Notify all participants except the one who triggered the change
  await notifyParticipants(order, userId, "order.status_changed", toStatus);

  return getById(orderId);
}

async function assign(orderId, collaboratorId) {
  const user = await User.query()
    .findById(collaboratorId)
    .whereNull("deleted_at");
  if (!user) throw ApiError.notFound("Collaborator not found");

  await Order.query().findById(orderId).patch({ collaborator_id: collaboratorId });

  const order = await getById(orderId);
  // Notify the assigned collaborator
  await notificationService.create({
    userId: collaboratorId,
    type: "order.assigned",
    title: `📋 Pedido asignado: ${order.order_number}`,
    body: `Se te ha asignado el pedido de ${order.client_name}`,
    data: { orderId, orderNumber: order.order_number },
  });

  return order;
}

async function getHistory(orderId) {
  return OrderStatusHistory.query()
    .alias("osh")
    .select("osh.*", "u.username as changed_by_name")
    .join("users as u", "osh.changed_by", "u.id")
    .where("osh.order_id", orderId)
    .orderBy("osh.created_at", "asc");
}

async function postProgress(orderId, userId, { title, description }) {
  const progress = await OrderProgress.query().insert({
    order_id: orderId,
    posted_by: userId,
    title,
    description: description || null,
  });

  // Notify client about progress update
  const order = await getById(orderId);
  await notifyParticipants(order, userId, "order.progress", title);

  return { id: progress.id, order_id: orderId, title, description };
}

async function getProgress(orderId) {
  return OrderProgress.query()
    .alias("op")
    .select("op.*", "u.username as posted_by_name")
    .join("users as u", "op.posted_by", "u.id")
    .where("op.order_id", orderId)
    .orderBy("op.created_at", "asc");
}

async function uploadPaymentProof(orderId, userId, { proof_url, proof_type }) {
  const order = await getById(orderId);
  if (order.client_id !== userId) throw ApiError.forbidden("Only the order owner can upload proof");
  if (!["accepted"].includes(order.status)) throw ApiError.conflict("Payment proof can only be uploaded when order is accepted");

  await Order.query().findById(orderId).patch({
    payment_proof_url: proof_url,
    payment_proof_type: proof_type || "image",
  });

  // Notify admin that client uploaded payment proof
  await notifyParticipants(order, userId, "order.payment_proof", "proof_uploaded");

  return { orderId, proof_url, proof_type };
}

async function getPaymentProof(orderId) {
  const order = await Order.query().findById(orderId).select("payment_proof_url", "payment_proof_type");
  if (!order) throw ApiError.notFound("Order not found");
  return { proof_url: order.payment_proof_url, proof_type: order.payment_proof_type };
}

module.exports = { create, getById, listAll, listByClient, listByCollaborator, transition, assign, getHistory, postProgress, getProgress, uploadPaymentProof, getPaymentProof };
