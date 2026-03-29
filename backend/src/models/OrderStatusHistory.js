"use strict";

const BaseModel = require("./BaseModel");

class OrderStatusHistory extends BaseModel {
  static get tableName() {
    return "order_status_history";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "changed_by", "to_status"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        changed_by: { type: "integer" },
        from_status: { type: ["string", "null"], maxLength: 30 },
        to_status: { type: "string", maxLength: 30 },
        note: { type: ["string", "null"] },
        ip_address: { type: ["string", "null"], maxLength: 45 },
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
        join: { from: "order_status_history.order_id", to: "orders.id" },
      },
      changedByUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "order_status_history.changed_by", to: "users.id" },
      },
    };
  }
}

module.exports = OrderStatusHistory;
