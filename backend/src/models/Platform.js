"use strict";

const BaseModel = require("./BaseModel");

class Platform extends BaseModel {
  static get tableName() {
    return "platforms";
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
        name: { type: "string", maxLength: 80 },
        slug: { type: "string", maxLength: 80 },
        icon_url: { type: ["string", "null"], maxLength: 500 },
        is_active: { type: "boolean", default: true },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Game = require("./Game");

    return {
      games: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Game,
        join: {
          from: "platforms.id",
          through: { from: "game_platforms.platform_id", to: "game_platforms.game_id" },
          to: "games.id",
        },
      },
    };
  }
}

module.exports = Platform;
