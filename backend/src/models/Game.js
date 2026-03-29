"use strict";

const BaseModel = require("./BaseModel");

class Game extends BaseModel {
  static get tableName() {
    return "games";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name", "slug"],
      properties: {
        id: { type: "integer" },
        name: { type: "string", maxLength: 150 },
        slug: { type: "string", maxLength: 150 },
        description: { type: ["string", "null"] },
        cover_url: { type: ["string", "null"], maxLength: 500 },
        is_active: { type: "boolean", default: true },
        sort_order: { type: "integer", default: 0 },
        created_at: { type: "string" },
        updated_at: { type: "string" },
        deleted_at: { type: ["string", "null"] },
      },
    };
  }

  static get relationMappings() {
    const Platform = require("./Platform");
    const Service = require("./Service");

    return {
      platforms: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Platform,
        join: {
          from: "games.id",
          through: { from: "game_platforms.game_id", to: "game_platforms.platform_id" },
          to: "platforms.id",
        },
      },
      services: {
        relation: BaseModel.HasManyRelation,
        modelClass: Service,
        join: { from: "games.id", to: "services.game_id" },
      },
    };
  }
}

module.exports = Game;
