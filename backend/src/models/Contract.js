"use strict";

const BaseModel = require("./BaseModel");

class Contract extends BaseModel {
  static get tableName() {
    return "contracts";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "content_html", "content_hash"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        template_version: { type: "string", maxLength: 20, default: "v1" },
        content_html: { type: "string" },
        content_hash: { type: "string", maxLength: 64 },
        client_signed_at: { type: ["string", "null"] },
        client_ip: { type: ["string", "null"], maxLength: 45 },
        client_user_agent: { type: ["string", "null"], maxLength: 500 },
        client_consent_text: { type: ["string", "null"], maxLength: 500 },
        admin_signed_at: { type: ["string", "null"] },
        admin_id: { type: ["integer", "null"] },
        admin_ip: { type: ["string", "null"], maxLength: 45 },
        admin_consent_text: { type: ["string", "null"], maxLength: 500 },
        status: {
          type: "string",
          enum: ["draft", "pending_client", "pending_admin", "fully_signed", "voided", "disputed", "skipped"],
          default: "draft",
        },
        voided_at: { type: ["string", "null"] },
        voided_reason: { type: ["string", "null"] },
        dispute_reason: { type: ["string", "null"] },
        disputed_at: { type: ["string", "null"] },
        disputed_by: { type: ["integer", "null"] },
        scheduled_dates: { type: ["object", "array", "null"] },
        created_at: { type: "string" },
        updated_at: { type: "string" },
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
        join: { from: "contracts.order_id", to: "orders.id" },
      },
      admin: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "contracts.admin_id", to: "users.id" },
      },
    };
  }
}

module.exports = Contract;
