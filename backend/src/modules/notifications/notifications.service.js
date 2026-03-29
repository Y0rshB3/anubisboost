"use strict";

const Notification = require("../../models/Notification");
const { paginate } = require("../../shared/paginate");
const knex = require("../../db/knex");
const mailer = require("../../shared/mailer");

let io = null;
function setIO(socketIO) { io = socketIO; }

async function create({ userId, type, title, body, data, channel = "both" }) {
  const notification = await Notification.query().insert({
    user_id: userId,
    type,
    title,
    body: body || null,
    data: data || null,
    channel,
  });

  const result = {
    id: notification.id,
    user_id: userId,
    type,
    title,
    body,
    data,
    created_at: notification.created_at || new Date(),
  };

  // Push via Socket.io
  if (io) {
    io.of("/notifications").to(`user:${userId}`).emit("notification:new", result);
  }

  // Send email if channel allows it
  if (channel === "both" || channel === "email") {
    try {
      const User = require("../../models/User");
      const user = await User.query().findById(userId).select("email");
      if (user?.email) {
        await mailer.sendOrderNotification(user.email, title, body || "");
      }
    } catch (err) {
      console.error("Email notification error:", err.message);
    }
  }

  return result;
}

async function list(userId, { page, limit }) {
  const query = Notification.query()
    .where("user_id", userId)
    .orderBy("created_at", "desc");

  return paginate(query, page, limit);
}

async function unreadCount(userId) {
  const result = await knex("notifications")
    .where("user_id", userId)
    .whereNull("read_at")
    .count("* as count")
    .first();
  return result.count;
}

async function markRead(id, userId) {
  await Notification.query()
    .findById(id)
    .where("user_id", userId)
    .patch({ read_at: new Date() });
}

async function markAllRead(userId) {
  await Notification.query()
    .where("user_id", userId)
    .whereNull("read_at")
    .patch({ read_at: new Date() });
}

async function remove(id, userId) {
  await Notification.query()
    .delete()
    .where("id", id)
    .where("user_id", userId);
}

// Notify on order status change
async function notifyOrderStatusChange(order, toStatus, changedBy) {
  const recipients = [order.client_id];
  if (order.collaborator_id) recipients.push(order.collaborator_id);

  for (const uid of recipients) {
    if (uid === changedBy) continue;
    await create({
      userId: uid,
      type: "order.status_changed",
      title: `Order ${order.order_number} updated`,
      body: `Status changed to: ${toStatus}`,
      data: { orderId: order.id, orderNumber: order.order_number, status: toStatus },
    });
  }
}

module.exports = { create, list, unreadCount, markRead, markAllRead, remove, notifyOrderStatusChange, setIO };
