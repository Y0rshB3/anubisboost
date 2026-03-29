"use strict";

const BaseModel = require("./BaseModel");

class ChatMessage extends BaseModel {
  static get tableName() {
    return "chat_messages";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "sender_id", "message"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        sender_id: { type: "integer" },
        message: { type: "string" },
        message_type: { type: "string", enum: ["text", "image"], default: "text" },
        is_system: { type: "boolean", default: false },
        read_at: { type: ["string", "null"] },
        deleted_at: { type: ["string", "null"] },
        created_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Order = require("./Order");
    const User = require("./User");

    return {
      order: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Order,
        join: { from: "chat_messages.order_id", to: "orders.id" },
      },
      sender: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "chat_messages.sender_id", to: "users.id" },
      },
    };
  }
}

module.exports = ChatMessage;
