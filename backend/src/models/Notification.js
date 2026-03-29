"use strict";

const BaseModel = require("./BaseModel");

class Notification extends BaseModel {
  static get tableName() {
    return "notifications";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "type", "title"],
      properties: {
        id: { type: "integer" },
        user_id: { type: "integer" },
        type: { type: "string", maxLength: 80 },
        title: { type: "string", maxLength: 255 },
        body: { type: ["string", "null"] },
        data: { type: ["object", "null"] },
        channel: { type: "string", enum: ["in_app", "email", "both"], default: "both" },
        read_at: { type: ["string", "null"] },
        emailed_at: { type: ["string", "null"] },
        created_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("./User");

    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "notifications.user_id", to: "users.id" },
      },
    };
  }
}

module.exports = Notification;
