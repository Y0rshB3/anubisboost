"use strict";

const BaseModel = require("./BaseModel");

class Order extends BaseModel {
  static get tableName() {
    return "orders";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_number", "client_id", "service_id", "service_snapshot", "total_price"],
      properties: {
        id: { type: "integer" },
        order_number: { type: "string", maxLength: 20 },
        client_id: { type: "integer" },
        collaborator_id: { type: ["integer", "null"] },
        service_id: { type: "integer" },
        status: {
          type: "string",
          enum: ["pending", "accepted", "payment_confirmed", "in_progress", "completed", "cancelled", "rejected"],
          default: "pending",
        },
        service_snapshot: { type: ["object", "string"] },
        desired_result: { type: ["string", "null"] },
        admin_notes: { type: ["string", "null"] },
        collaborator_notes: { type: ["string", "null"] },
        total_price: { type: ["number", "string"] },
        currency: { type: "string", maxLength: 3, default: "USD" },
        payment_type: { type: ["string", "null"], enum: ["full", "partial", null] },
        started_at: { type: ["string", "null"] },
        completed_at: { type: ["string", "null"] },
        due_date: { type: ["string", "null"] },
        cancelled_reason: { type: ["string", "null"] },
        rejected_reason: { type: ["string", "null"] },
        created_at: { type: "string" },
        updated_at: { type: "string" },
        deleted_at: { type: ["string", "null"] },
      },
    };
  }

  static get relationMappings() {
    const User = require("./User");
    const Service = require("./Service");
    const OrderStatusHistory = require("./OrderStatusHistory");
    const OrderProgress = require("./OrderProgress");
    const Credential = require("./Credential");
    const Contract = require("./Contract");
    const Payment = require("./Payment");
    const ChatMessage = require("./ChatMessage");

    return {
      client: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "orders.client_id", to: "users.id" },
      },
      collaborator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: { from: "orders.collaborator_id", to: "users.id" },
      },
      service: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Service,
        join: { from: "orders.service_id", to: "services.id" },
      },
      statusHistory: {
        relation: BaseModel.HasManyRelation,
        modelClass: OrderStatusHistory,
        join: { from: "orders.id", to: "order_status_history.order_id" },
      },
      progress: {
        relation: BaseModel.HasManyRelation,
        modelClass: OrderProgress,
        join: { from: "orders.id", to: "order_progress.order_id" },
      },
      credential: {
        relation: BaseModel.HasOneRelation,
        modelClass: Credential,
        join: { from: "orders.id", to: "credentials.order_id" },
      },
      contract: {
        relation: BaseModel.HasOneRelation,
        modelClass: Contract,
        join: { from: "orders.id", to: "contracts.order_id" },
      },
      payments: {
        relation: BaseModel.HasManyRelation,
        modelClass: Payment,
        join: { from: "orders.id", to: "payments.order_id" },
      },
      chatMessages: {
        relation: BaseModel.HasManyRelation,
        modelClass: ChatMessage,
        join: { from: "orders.id", to: "chat_messages.order_id" },
      },
    };
  }
}

module.exports = Order;
