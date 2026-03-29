"use strict";

const BaseModel = require("./BaseModel");

class Payment extends BaseModel {
  static get tableName() {
    return "payments";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "recorded_by", "amount", "payment_type", "method", "paid_at"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        recorded_by: { type: "integer" },
        amount: { type: "number" },
        currency: { type: "string", maxLength: 3, default: "USD" },
        payment_type: { type: "string", enum: ["full", "partial"] },
        method: { type: "string", maxLength: 80 },
        reference: { type: ["string", "null"], maxLength: 255 },
        paid_at: { type: "string" },
        notes: { type: ["string", "null"] },
        proof_url: { type: ["string", "null"], maxLength: 500 },
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
        join: { from: "payments.order_id", to: "orders.id" },
      },
      recordedByUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "payments.recorded_by", to: "users.id" },
      },
    };
  }
}

module.exports = Payment;
