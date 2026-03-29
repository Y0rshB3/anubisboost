"use strict";

const { verifyAccessToken } = require("../../shared/jwt");
const chatService = require("./chat.service");
const notificationService = require("../notifications/notifications.service");
const Order = require("../../models/Order");
const User = require("../../models/User");

function setupChatNamespace(io) {
  const chatNs = io.of("/orders");

  chatNs.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  chatNs.on("connection", (socket) => {
    socket.on("join_order", async ({ orderId }) => {
      const userId = socket.data.user.userId;
      const order = await Order.query()
        .findById(orderId)
        .where((qb) => {
          qb.where("client_id", userId).orWhere("collaborator_id", userId);
        })
        .first();

      const user = await User.query()
        .findById(userId)
        .withGraphFetched("role")
        .modifyGraph("role", (b) => b.select("name"));

      if (!order && user?.role?.name !== "admin") {
        return socket.emit("error", { code: "FORBIDDEN", message: "No access to this order" });
      }
      socket.join(`order:${orderId}`);
    });

    socket.on("leave_order", ({ orderId }) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("chat:send", async ({ orderId, message, type }) => {
      // Verify room membership
      if (!socket.rooms.has(`order:${orderId}`)) {
        return socket.emit("error", { code: "FORBIDDEN", message: "Join the order room first" });
      }
      if (typeof message !== "string" || !message.trim()) return;

      const saved = await chatService.saveMessage(orderId, socket.data.user.userId, message.trim(), false, type || "text");
      chatNs.to(`order:${orderId}`).emit("chat:message", saved);

      // Notify other participants
      try {
        const o = await Order.query()
          .findById(orderId)
          .select("order_number", "client_id", "collaborator_id");

        if (o) {
          const sender = await User.query()
            .findById(socket.data.user.userId)
            .select("username");
          const senderName = sender?.username || "Someone";
          const recipients = new Set();
          if (o.client_id) recipients.add(o.client_id);
          if (o.collaborator_id) recipients.add(o.collaborator_id);

          // Also notify admins who might be watching
          const admins = await User.query()
            .joinRelated("role")
            .where("role.name", "admin")
            .where("users.is_active", true)
            .select("users.id");
          admins.forEach((a) => recipients.add(a.id));

          recipients.delete(socket.data.user.userId); // Don't notify sender

          const msgPreview = type === "image" ? "Image" : (message.length > 50 ? message.slice(0, 50) + "..." : message);

          for (const uid of recipients) {
            await notificationService.create({
              userId: uid,
              type: "chat.message",
              title: `${senderName} - ${o.order_number}`,
              body: msgPreview,
              data: { orderId, orderNumber: o.order_number },
            });
          }
        }
      } catch (err) {
        // Don't fail the chat message if notification fails
        console.error("Chat notification error:", err.message);
      }
    });

    socket.on("chat:typing", ({ orderId }) => {
      socket.to(`order:${orderId}`).emit("chat:typing", { orderId, userId: socket.data.user.userId });
    });

    socket.on("chat:stop_typing", ({ orderId }) => {
      socket.to(`order:${orderId}`).emit("chat:stop_typing", { orderId, userId: socket.data.user.userId });
    });
  });

  return chatNs;
}

module.exports = { setupChatNamespace };
