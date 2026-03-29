"use strict";

const BaseModel = require("./BaseModel");

class ServiceType extends BaseModel {
  static get tableName() {
    return "service_types";
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
        name: { type: "string", maxLength: 100 },
        slug: { type: "string", maxLength: 100 },
        description: { type: ["string", "null"] },
        is_active: { type: "boolean", default: true },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Service = require("./Service");

    return {
      services: {
        relation: BaseModel.HasManyRelation,
        modelClass: Service,
        join: { from: "service_types.id", to: "services.service_type_id" },
      },
    };
  }
}

module.exports = ServiceType;
