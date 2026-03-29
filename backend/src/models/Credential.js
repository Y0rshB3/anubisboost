"use strict";

const BaseModel = require("./BaseModel");

class Credential extends BaseModel {
  static get tableName() {
    return "credentials";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "uploaded_by", "iv", "auth_tag", "ciphertext"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        uploaded_by: { type: "integer" },
        iv: { type: "string", maxLength: 32 },
        auth_tag: { type: "string", maxLength: 32 },
        ciphertext: { type: "string" },
        viewed_at: { type: ["string", "null"] },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Order = require("./Order");

    return {
      order: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Order,
        join: { from: "credentials.order_id", to: "orders.id" },
      },
    };
  }
}

module.exports = Credential;
