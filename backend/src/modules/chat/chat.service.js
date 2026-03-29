"use strict";

const ChatMessage = require("../../models/ChatMessage");
const { paginate } = require("../../shared/paginate");

async function getMessages(orderId, { page, limit }) {
  const query = ChatMessage.query()
    .alias("cm")
    .select("cm.*", "u.username as sender_name", "u.avatar_url as sender_avatar")
    .join("users as u", "cm.sender_id", "u.id")
    .where("cm.order_id", orderId)
    .whereNull("cm.deleted_at")
    .orderBy("cm.created_at", "asc");

  return paginate(query, page, limit || 50);
}

async function saveMessage(orderId, senderId, message, isSystem = false, messageType = "text") {
  const msg = await ChatMessage.query().insert({
    order_id: orderId,
    sender_id: senderId,
    message,
    is_system: isSystem,
    message_type: messageType,
  });

  const row = await ChatMessage.query()
    .alias("cm")
    .select("cm.*", "u.username as sender_name", "u.avatar_url as sender_avatar")
    .join("users as u", "cm.sender_id", "u.id")
    .where("cm.id", msg.id)
    .first();

  return row;
}

async function deleteMessage(messageId) {
  await ChatMessage.query().findById(messageId).patch({ deleted_at: new Date() });
}

module.exports = { getMessages, saveMessage, deleteMessage };
