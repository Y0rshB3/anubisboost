"use strict";

const BaseModel = require("./BaseModel");

class Ban extends BaseModel {
  static get tableName() { return "bans"; }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["ban_type", "ban_value", "banned_by"],
      properties: {
        id: { type: "integer" },
        ban_type: { type: "string", enum: ["email", "ip"] },
        ban_value: { type: "string", maxLength: 255 },
        reason: { type: ["string", "null"] },
        banned_by: { type: "integer" },
        is_active: { type: "boolean" },
        expires_at: { type: ["string", "null"] },
      },
    };
  }
}

module.exports = Ban;
