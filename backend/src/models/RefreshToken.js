"use strict";

const BaseModel = require("./BaseModel");

class RefreshToken extends BaseModel {
  static get tableName() {
    return "refresh_tokens";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "token_hash", "expires_at"],
      properties: {
        id: { type: "integer" },
        user_id: { type: "integer" },
        token_hash: { type: "string", maxLength: 255 },
        user_agent: { type: ["string", "null"], maxLength: 500 },
        ip_address: { type: ["string", "null"], maxLength: 45 },
        expires_at: { type: "string" },
        revoked_at: { type: ["string", "null"] },
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
        join: { from: "refresh_tokens.user_id", to: "users.id" },
      },
    };
  }
}

module.exports = RefreshToken;
