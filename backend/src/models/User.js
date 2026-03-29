"use strict";

const BaseModel = require("./BaseModel");

class User extends BaseModel {
  static get tableName() {
    return "users";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["role_id", "email", "username"],
      properties: {
        id: { type: "integer" },
        role_id: { type: "integer" },
        email: { type: "string", maxLength: 255 },
        username: { type: "string", maxLength: 100 },
        password_hash: { type: ["string", "null"], maxLength: 255 },
        google_id: { type: ["string", "null"], maxLength: 255 },
        avatar_url: { type: ["string", "null"], maxLength: 500 },
        pending_email: { type: ["string", "null"], maxLength: 255 },
        email_change_code: { type: ["string", "null"], maxLength: 6 },
        email_change_expires: { type: ["string", "null"] },
        phone: { type: ["string", "null"], maxLength: 20 },
        is_active: { type: "boolean", default: true },
        email_verified: { type: "boolean", default: false },
        two_factor_enabled: { type: "boolean", default: false },
        two_factor_method: { type: ["string", "null"], enum: ["email", "sms", null] },
        two_factor_code: { type: ["string", "null"], maxLength: 6 },
        two_factor_expires: { type: ["string", "null"] },
        email_verify_token: { type: ["string", "null"], maxLength: 255 },
        password_reset_token: { type: ["string", "null"], maxLength: 255 },
        password_reset_expires: { type: ["string", "null"] },
        last_login_at: { type: ["string", "null"] },
        last_login_ip: { type: ["string", "null"], maxLength: 45 },
        created_at: {},
        updated_at: {},
        deleted_at: {},
      },
    };
  }

  static get relationMappings() {
    const Role = require("./Role");
    const Order = require("./Order");
    const RefreshToken = require("./RefreshToken");

    return {
      role: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Role,
        join: { from: "users.role_id", to: "roles.id" },
      },
      clientOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: Order,
        join: { from: "users.id", to: "orders.client_id" },
      },
      collaboratorOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: Order,
        join: { from: "users.id", to: "orders.collaborator_id" },
      },
      refreshTokens: {
        relation: BaseModel.HasManyRelation,
        modelClass: RefreshToken,
        join: { from: "users.id", to: "refresh_tokens.user_id" },
      },
    };
  }
}

module.exports = User;
