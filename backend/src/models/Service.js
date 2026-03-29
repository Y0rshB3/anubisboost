"use strict";

const BaseModel = require("./BaseModel");

class Service extends BaseModel {
  static get tableName() {
    return "services";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["game_id", "platform_id", "service_type_id", "name", "base_price"],
      properties: {
        id: { type: "integer" },
        game_id: { type: "integer" },
        platform_id: { type: "integer" },
        service_type_id: { type: "integer" },
        name: { type: "string", maxLength: 200 },
        description: { type: ["string", "null"] },
        base_price: { type: "number" },
        currency: { type: "string", maxLength: 3, default: "USD" },
        estimated_days: { type: ["integer", "null"] },
        is_active: { type: "boolean", default: true },
        sort_order: { type: "integer", default: 0 },
        metadata: { type: ["object", "null"] },
        created_at: { type: "string" },
        updated_at: { type: "string" },
        deleted_at: { type: ["string", "null"] },
      },
    };
  }

  static get relationMappings() {
    const Game = require("./Game");
    const Platform = require("./Platform");
    const ServiceType = require("./ServiceType");
    const PriceRule = require("./PriceRule");

    return {
      game: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Game,
        join: { from: "services.game_id", to: "games.id" },
      },
      platform: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Platform,
        join: { from: "services.platform_id", to: "platforms.id" },
      },
      serviceType: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: ServiceType,
        join: { from: "services.service_type_id", to: "service_types.id" },
      },
      priceRules: {
        relation: BaseModel.HasManyRelation,
        modelClass: PriceRule,
        join: { from: "services.id", to: "price_rules.service_id" },
      },
    };
  }
}

module.exports = Service;
