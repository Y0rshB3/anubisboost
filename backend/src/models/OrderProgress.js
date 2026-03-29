"use strict";

const BaseModel = require("./BaseModel");

class OrderProgress extends BaseModel {
  static get tableName() {
    return "order_progress";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "posted_by", "title"],
      properties: {
        id: { type: "integer" },
        order_id: { type: "integer" },
        posted_by: { type: "integer" },
        title: { type: "string", maxLength: 200 },
        description: { type: ["string", "null"] },
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
        join: { from: "order_progress.order_id", to: "orders.id" },
      },
      postedByUser: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "order_progress.posted_by", to: "users.id" },
      },
    };
  }
}

module.exports = OrderProgress;
